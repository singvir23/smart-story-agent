import Event from '../utils/event.js';

const OptionsView = () => {
	const hideUnselectedCharsEvent = Event();
	const includeSelectedCharsAlwaysEvent = Event();
	const hideScenesWoSelectedCharsEvent = Event();
	const hideUnselectedScenesEvent = Event();
	const spaceOutScenesEvent = Event();
	const updateStorylineEvent = Event();
	const updateStorylineScenesEvent = Event();
	const selectCharsInCurrSceneEvent = Event();
	const resetCharSelectionEvent = Event();
	const resetStorylineEvent = Event();
	const printPdfEvent = Event();
	const showDatesEvent = Event();

	function init() {
		// document
		// 	.getElementById('checkbox-show-dates')
		// 	.addEventListener('click', () => showDatesEvent.trigger());
		document
			.getElementById('button-reset-storyline')
			.addEventListener('click', () => resetStorylineEvent.trigger());
	}

	return {
		init,
		hideUnselectedCharsEvent,
		includeSelectedCharsAlwaysEvent,
		hideScenesWoSelectedCharsEvent,
		hideUnselectedScenesEvent,
		spaceOutScenesEvent,
		updateStorylineEvent,
		updateStorylineScenesEvent,
		selectCharsInCurrSceneEvent,
		resetCharSelectionEvent,
		resetStorylineEvent,
		printPdfEvent,
		showDatesEvent,
	};
};

export default OptionsView;
