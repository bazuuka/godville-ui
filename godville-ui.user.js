// ==UserScript==
// @name           godville-ui
// @namespace      http://godville.net/userscripts
// @description    Some improvements for godville ui
// @include        http://godville.net/hero*
// @require        http://mesak-project.googlecode.com/files/jquery.142.gm.js
// @resource       Words http://github.com/bazuuka/godville-ui/raw/master/phrases.json
// @resource       Style http://github.com/bazuuka/godville-ui/raw/master/godville-ui.css
// @license        GNU General Public License v3
// ==/UserScript==

var version = 1;
var script_link = 'http://userscripts.org/scripts/show/81101';

// Style
// TODO: вынести стиль в отдельный файл и подключить с помощью @resource
GM_addStyle( GM_getResourceText('Style') );

//  --- All words from phrases.json ---

// JSON.parse не поддерживает комментарии в JSON. Whyyyyy ???
// пришлось использовать небезопасный eval.
// TODO: JSON.minify? yaml? -- и для того и другого нужна еще одна библиотечка
var words = eval('(' + GM_getResourceText('Words') + ')');

// Проверка версии
if (words['version'] > version) {
	alert("Внимание! Вы используете новый phrases.json со старым скриптом!\n\n"
		  + ' - попробуйте обновить скрипт: ' + script_link + "\n"
		  + '(предварительно сохраните новый phrases.json, не зря же вы его вручную ставили)');
} else if (words['version'] < version) {
	alert("Внимание! Вы используете старый phrases.json с новым скриптом\n\n"
		  + " - попробуйте переустановить скрипт: " + script_link + "\n"
		  + " - или, если Вы изменяли phrases.json, и сейчас используете его, вручную найти что изменилось и поправить");
}

// ------------------------
//      HELPERS
// ------------------------

// Чтение массива
function get_random_item(arr) {
	return arr[Math.floor ( Math.random() * arr.length )];
}
// Случайная фраза в разделе 'sect'
function get_random_phrase(sect) {
	return get_random_item( words['phrases'][sect] );
}

// Базовый алгоритм произнесения фразы
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

function findLabel($base_elem, label_name) {
	return $('.l_capt', $base_elem).filter(function(index){
			return $(this).text() == label_name;
		});
}

// Search for label with given name and appends after it
// given elem
function addAfterLabel($base_elem, label_name, $elem) {
	findLabel($base_elem, label_name).after($elem.addClass('label-appended'));
}

// Generic say button
function getGenSayButton(title, array) {
	return $('<a href="#">' + title + '</a>')
		.click(function() {
			sayToHero(get_random_item(array));
			return false;
		});
}

// Хелпер объединяет addAfterLabel и getGenSayButton
// + берет фразы из words['phrases']
function addSayPhraseAfterLabel($base_elem, label_name, btn_name, section) {
	var arr = words['phrases'][section];
	addAfterLabel($base_elem, label_name, getGenSayButton(btn_name, arr));
}

// Сохранение текущий показателей
// Возвращает разницу, если уже было что-то записано
function storeParam(id, value) {
	var diff = null;
	var data_id = 'param_' + id;
	var old = $(document).data(data_id);
	if (old != null) {
		diff = value - old;
	}
	$(document).data(data_id, value);
	return diff;
}

function appendToLog(id, str, descr) {
	$('#stats_log').append('<li class="' + id + '" title="' + descr + '">' + str + '</li>');
	// TODO: удалить первые, если много
}

// Основной алгоритм слежки
function watchValue(id, name, descr, value) {
	var diff = storeParam(id, value);
	if(diff) {
		appendToLog(id, name + ': ' + diff, descr);
	}
}
// Адаптация для прогрессбаров
function watchProgressBar(id, name, descr, $elem) {
	watchValue(id, name, descr, 100 - $elem.css('width').replace(/%/, ''));
}

function watchLabelCounter(id, name, descr, $container, label) {
	var $label = findLabel($container, label);
	var $field = $label.nextAll('.field_content').first(); /* Seems it is not very good query */
	var value = parseInt($field.text());
	watchValue(id, name, descr, value);
}

// ------------------------------------
//  Improvements !!
// ------------------------------------

// -------- Hero Loot -----------------
function getInspectQueryText(item_name) {
	return get_random_phrase('inspect_prefix') + ' "' + item_name + '"';
}

function isHealItem(item_name) {
	return words['items']['heal'].indexOf(item_name) >= 0;
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

function isArena() {
	return $('#last_items_arena').length > 0;
}

function appendCheckbox($div, id, label) {
	$div.append('<input type="checkbox" id="' + id +  '" >');
	$div.append('<label for="' + id + '">' + label + '</label>');
}

function generateArenaPhrase() {
	var parts = [];
	var keys = ['hit', 'heal', 'pray'];
	for (i in keys) {
		var key = keys[i];
		if ($('#say_' + key).is(':checked')) {
			parts.push(get_random_phrase(key));
		}
	}
	// TODO: shuffle parts
	// TODO: smart join: .... , .... и ....
	var msg = parts.join(', ');
	if(msg.length < 80) {
		return msg;
	} else {
		return generateArenaPhrase();
	}
}

function getArenaSayBox() {
	// TODO: стиль для бокса, чтобы он был по центру
	var $div = $('<div id="arena_say_box"></div>');

	appendCheckbox($div, 'say_hit', 'бей');
	appendCheckbox($div, 'say_heal', 'лечись');
	appendCheckbox($div, 'say_pray', 'молись');

	$div.click(function() { sayToHero(generateArenaPhrase);});
	return $div;
}

function improveSayDialog() {
	if (isAlreadyImproved( $('#aog_box') )) return;

	// Hide hint
	$('#aog_hint_label').hide();

	// Add links
	var $box = $('#hero_actsofgod');

	if (isArena()) {
		$('#god_phrase_form').before(getArenaSayBox());
	} else {
		addSayPhraseAfterLabel($box, 'Прана', 'жертва', 'sacrifice');
		addSayPhraseAfterLabel($box, 'Прана', 'ещё', 'pray');
	}

	watchProgressBar('prana', 'pr', 'Прана',  $('#pr5'));
}

// ----------- Вести с полей ----------------
function improveFieldBox() {
	if (isAlreadyImproved( $('#hero_details fieldset') )) return;

	// Add links
	var $box = $('#hero_details');

	addSayPhraseAfterLabel($box, 'Противник', 'бей', 'hit');
}

// ---------- Stats --------------

function improveStats() {
	if (isAlreadyImproved( $('#hs_box') )) return;

	// Add links
	var $box = $('#hero_stats');

	addSayPhraseAfterLabel($box, 'Уровень', 'ещё', 'exp');
	addSayPhraseAfterLabel($box, 'Здоровье', 'ещё', 'heal');
	addSayPhraseAfterLabel($box, 'Золота', 'ещё', 'gold');
	addSayPhraseAfterLabel($box, 'Задание', 'отмена', 'cancel_task');
	addSayPhraseAfterLabel($box, 'Задание', 'ещё', 'do_task');
	addSayPhraseAfterLabel($box, 'Смертей', 'ещё', 'die');
	addSayPhraseAfterLabel($box, 'Столбов от столицы', 'дом', 'town');

	watchProgressBar('exp', 'exp', 'Опыт',  $('#pr3'));
	watchProgressBar('tsk', 'tsk', 'Задание',  $('#pr4'));
	watchLabelCounter('level', 'lvl', 'Уровень',  $box, 'Уровень');
	watchLabelCounter('inv', 'inv', 'Инвентарь',  $box, 'Инвентарь');
	watchLabelCounter('heal', 'hp', 'Здоровье',  $box, 'Здоровье');
	watchLabelCounter('gold', 'gld', 'Золото',  $box, 'Золота'); /* Не работает! Нужен собственный парсер */
	watchLabelCounter('monster', 'mns', 'Монстры',  $box, 'Убито монстров');
 	watchLabelCounter('death', 'death', 'Смерти',  $box, 'Смертей');
 	watchLabelCounter('brick', 'br', 'Кирпичи',  $box, 'Кирпичей для храма'); /* сюда тоже */
}

// -------- do all improvements ----------
function improve() {
	improveLoot();
	improveSayDialog();
	improveStats();
	improveFieldBox();
}

// Main code
$(function() {
	$('#menu_bar').after('<ul id="stats_log"/>');
	improve();
	// FIXME: this will repear all improve on all mouse movement
	// may be use less expensive event (live? handle ajax request?)
	$('body').hover( function() { improve(); } );
});
