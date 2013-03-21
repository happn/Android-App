var app = {};

app.utils = {
	 twoDigits : function(d){
        return (d.toString()).length === 1 ? "0" + d : d;
    },
	nowString : function(joiner){
        var n = new Date(),
        	joiner = joiner || '';

        return  [this.twoDigits(n.getDate()), this.twoDigits(n.getMonth()+1) , n.getFullYear()].join(joiner);
    },
    deSchwuchtify : function(d){
    	d = d.split("/");
    	return [d[1], d[0], d[2]].join(".");
    },
    getWeekDays : function (date) {        
        var weekdays = [],
            len = date.length,
            target = date.getMonth ? date : new Date(date.slice(len - 6, len - 4) + "." + date.slice(0, len - 6) + "." + date.slice(len - 4, len)),
            day = target.getDay(),
            month = target.getMonth() + 1,
            year = target.getFullYear(),
            date = target.getDate(),
            monday = 0;

        day = day == 0 ? 6 : day - 1;
        if (date - day > 0) {
            monday = date - day;

            for (var day = 0; day <= 6; day++) {
                if (monday > this.getMaxDays(month, year)) {
                    monday = 1;
                    month++;
                    if (month > 12) {
                        year++;
                        month = 1;
                    }
                }
                weekdays[day] = [this.twoDigits(monday++), this.twoDigits(month), year].join('.');
            }
            return weekdays;
        } else {
            for (var c = day; c > 0; c--) {
                if ((date - 1) === 0) {
                    month--;
                    if (month === 0) year--;
                    date = this.getMaxDays(month, year);

                } else {
                    date--;
                }
            }
            return this.getWeekDays([this.twoDigits(date), this.twoDigits(month), year].join('.'));
        }
    },
    getMaxDays :  function(month, year) {
            var isSchaltJahr = (year % 4 == 0) && (year % 100 != 0) || (year % 400 == 0),
                isFeb = (month == 2),
                isLongMonth = ((month <= 7) && (month % 2 != 0)) || ((month > 7) && (month % 2 == 0));

            return (isFeb && isSchaltJahr) ? 29 : isFeb ? 28 : isLongMonth ? 31 : 30;
    },

    getWeekday : function(date){
    	var days = "Montag0Dienstag0Mittwoch0Donnerstag0Freitag0Samstag0Sonntag".split(0);
    	date = date.split(".");
    	date = new Date([date[2], date[1], date[0]].join(","));
    	
    	return days[date.getDay()-1];

    },
};

app.start = function(){
	this.listOpen = false;
	this.$menua = $('#menua');
	this.$menub = $('#menub');
	this.fetch();
	this.bind();
};

app.data = {};


app.fetch = function(){
	var now = app.utils.nowString('.'),
		weekdays = app.utils.getWeekDays(new Date());

	app.curDate = now;

	for(var i = 0, len= weekdays.length; i < len; i++){
		app.data[weekdays[i]] = {};
	}

	$.getScript("http://appserver.happn.de:8010/v1/week/"+ app.utils.nowString() +"?callback=app.onData");
};

app.onData = function(response){
	if(response.success){
		var data = response.data,
			i = data.length-1;
		
		while(i--){
			var date = app.utils.deSchwuchtify(data[i].date);

			if( date in app.data){
				data[i].day = app.utils.getWeekday(date);
				app.data[date] = data[i];
			}
		}

		app.updateList.call(app);
		app.updateMain.call(app);
	}
};

app.updateList = function(){
	var	$list = $('#daylist li'),
		count = 0;

	$.each(app.data, function(date){
		$list.eq(count++).find("a").data("date", date).append('<small>'+ date +'</small>');
	});
};

app.updateMain = function(){
	var data = app.data[app.curDate];

	if(!data){
		return;
	}

	this.$menua.find(".desc").html(data.menu_a.title);
	this.$menua.find(".upvotes .ui-btn-text").text(data.menu_a.up_votes);
	this.$menua.find(".downvotes .ui-btn-text").text(data.menu_a.down_votes);

	if(data.menu_a.picture !== ""){
		$('#menua-img img').attr("src", data.menu_a.picture);
	}

	this.$menub.find(".desc").html(data.menu_b.title);
	this.$menub.find(".upvotes .ui-btn-text").text(data.menu_b.up_votes);
	this.$menub.find(".downvotes .ui-btn-text").text(data.menu_b.down_votes);

	if(data.menu_b.picture !== ""){
		$('#menub-img img').attr("src", data.menu_b.picture);
	}

};

app.vote = function($element){
	var menu =  $element.parent().data('relation'),
		method = $element.data("method");

	console.log(menu, method);
};

app.showPicture = function($pic){
	var menu = $pic.attr("id") === 'picbtna' ? 'a' : 'b';

	$('#imageViewer img').attr("src", "http://78.46.19.228:5984/hfuapp/"+ app.utils.nowString() + "/menu_" + menu);
	$.mobile.changePage('#imageViewer');
};


app.bind = function(){

	$('#main').live('pagebeforeshow', function(event, obj){
	 	app.updateMain.call(app);
	});

	$(document).on("click", ".buttons a",function(event){
		event.preventDefault();
		app.vote($(this));
	}).on("click", '#picbtna, #picbtnb', function(){
		app.showPicture($(this));
	});

	$('#daylist li a').on('click', function(){
	 	app.curDate = $(this).data("date");
	});

	$(document).bind("mobileinit", function(){
	  $.mobile.touchOverflowEnabled = true;
	  $.mobile.defaultPageTransition = "slide";
	}).bind("swiperight", function(){
		$.mobile.changePage('#list', {transition : "realslide", reverse: true});
	});

};


$(function(){
	app.start.call(app);
});