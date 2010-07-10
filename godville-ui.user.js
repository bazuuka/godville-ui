// ==UserScript==
// @name           godville-ui
// @namespace      http://godville.net/userscripts
// @description    Some improvements for godville ui
// @include        http://godville.net/hero*
// @require        http://mesak-project.googlecode.com/files/jquery.142.gm.js
// @license        GNU General Public License v3
// ==/UserScript==

// ------------ HELPERS ---------------
function get_random_item(arr) {
	return arr[Math.floor ( Math.random() * arr.length )];
}

function sayToHero(phrase) {
	$('#aog_hint_label').hide();
	$('#god_phrase').val(phrase);
}

// Checks if $elem already improved
function isAlreadyImproved($elem) {
	if ($elem.hasClass('improved')) return true;
	$elem.addClass('improved');
	return false
}


// -------- Hero Loot -----------------
function getInspectQueryText(item_name) {
	var verb = get_random_item(['исследуй', 'осмотри', 'рассмотри']);
	return verb + ' "' + item_name + '"';
}

function isHealItem(item_name) {
	// Source: http://wiki.godville.net/index.php/Лечебные_трофеи
	items = [ 'крем после битья', 'мензурку с раствором йода', 'набор юного хирурга',
		  'пузырёк с надписью «Выпей меня»', 'пузырёк с надписью «Сьешь меня»',
		  'пузырёк витамина С++', 'таблеточное месиво', 'трофейный стимпак',
		  'флакон антисептика', 'флягу с лечащим пойлом', 'фляжку живой воды',
		  'эссенцию здоровья', 'пузырёк витамина С++' ];
	return items.indexOf(item_name) >= 0;
}

// Main button creater
function improveLoot() {
	if (isAlreadyImproved($('#inv_box'))) return;

	function createInspectButton(item_name) {
		return $('<a href="#">?</a>')
			.click(function(){
				sayToHero(getInspectQueryText(item_name));
				return false;
			});
	}

	// Parse items
	$('#hero_loot ul li').each(function(ind, obj) {
		var $obj = $(obj);
		var item_name = $('span', $obj).text().replace(/^\s+|\s+$/g, '');
		// color items, and add buttons
		if (isHealItem(item_name)) {
			$obj.css('color', 'green');
		} else {
			$obj.append(createInspectButton(item_name));
		}
	});
}


// -------------- Phrases ---------------------------
// Generic say button
function getGenSayButton(title, array) {
	return $('<a href="#">' + title + '</a>')
		.click(function() {
			sayToHero(get_random_item(array));
			return false;
		});
}

function improveSayDialog() {
	if (isAlreadyImproved( $('#aog_box') )) return;

	// Hide hint
	$('#aog_hint_label').hide();

	// Add div for buttons
	var $btns = $('<div/>');
	$('.aog_capt').after($btns);
	// Клад
	$btns.append(getGenSayButton('клад', ['Ищи клад', 'Ищи золото']
	                              )).append(', ');
	// Опыт
	$btns.append(getGenSayButton('опыт', ['Набирайся опыта', 'Учись, набирайся опыта']
	                              )).append(', ');
	// Молитва
	$btns.append(getGenSayButton('прана', ['Кто не молится, тот не ест',
					       'Молись, собака, смертный прыщ! На колени!'
					       ]
	                              )).append(', ');
	// Жертва
	$btns.append(getGenSayButton('жертва', ['Принеси мне жертву', 'Жертву мне жеертвуу!']
	                              )).append(', ');
	// В город
	$btns.append(getGenSayButton('в город',['Иди в город', 'Возвращайся в город']
	                              ));
}

// ---------- Stats --------------

function improveStats() {
	if (isAlreadyImproved( $('#hero_stats_i') )) return;
}

// -------- do all improvements ----------
function improve() {
	improveLoot();
	improveSayDialog();
	improveStats();
}

// Main code
$(function() {
	improve();
	// FIXME: this will repear all improve on all mouse movement
	// may be use less expensive event (live? handle ajax request?)
	$('body').hover( function() { improve(); } )
});



