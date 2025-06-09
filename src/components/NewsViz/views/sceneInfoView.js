import Event from '../utils/event.js';
import { ScrollDirection } from '../utils/consts.js';
import { convertDate } from '../utils/convertDates.js';

const SceneInfoView = () => {
	const resetFocusEvent = Event();
	const scrollEvent = Event();

	function init() {
		document
			.getElementById('previous-button')
			.addEventListener('click', () =>
				scrollEvent.trigger(ScrollDirection.LEFT)
			);
		document
			.getElementById('next-button')
			.addEventListener('click', () =>
				scrollEvent.trigger(ScrollDirection.RIGHT)
			);
		document
			.getElementById('focus-button')
			.addEventListener('click', () => resetFocusEvent.trigger());
	}

	function update(title, date, description, location) {
		document.getElementById('event-date').innerHTML = date
			? `🕐${convertDate(new Date(date), true)}`
			: '';
		document.getElementById('event-location').innerHTML = location
			? `📍${location}`
			: '';
		document.getElementById('event-title').innerHTML = title
			? title
			: 'Select an event';
		document.getElementById('event-info').innerHTML = description
			? description
			: 'Click on an event or the "Next event" button to see more information about a specific event.';
	}

	return {
		init,
		update,
		resetFocusEvent,
		scrollEvent,
	};
};

export default SceneInfoView;
