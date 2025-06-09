import InteractiveNarrative from './models/interactiveNarrative.js';
import OptionsController from './controllers/optionsController.js';
import SceneInfoController from './controllers/sceneInfoController.js';
// import TimeSelectController from './controllers/timeSelectController.js';
import TimelineController from './controllers/timelineController.js';
import LinkVisualizationController from './controllers/linkVisualizationController.js';
import AppearanceVisualizationController from './controllers/appearanceVisualizationController.js';
import SceneVisualizationController from './controllers/sceneVisualizationController.js';
import IntroVisualizationController from './controllers/introVisualizationController.js';
import MainVisualizationController from './controllers/mainVisualizationController.js';

const App = (storyTimeline) => {
	const models = {
		narrative: InteractiveNarrative(storyTimeline),
	};

	const controllers = {
		options: OptionsController(models.narrative),
		sceneInfo: SceneInfoController(models.narrative),
		// timeSelect: TimeSelectController(models.narrative),
		mainVisualization: MainVisualizationController(models.narrative),
		linkVisualization: LinkVisualizationController(models.narrative),
		sceneVisualization: SceneVisualizationController(models.narrative),
		introVisualization: IntroVisualizationController(models.narrative),
		appearanceVisualization: AppearanceVisualizationController(
			models.narrative
		),
		timeline: TimelineController(models.narrative),
	};

	// NOTE: If two controllers are connected, then they need to communicate. This communication channel, as of now, is unidirectional.
	// controllers.hideSidebar.connect(controllers.mainVisualization);
	controllers.options.connect(controllers.timeline);

	// NOTE: The order in which things load is important.
	// In this case, our model (narrative) needs to load before the views are
	// created because the initialization of some of them (e.g. the character
	// selection) depend on the narrative being available.
	async function run() {
		for (const model in models) {
			await models[model].init();
		}

		for (const controller in controllers) {
			controllers[controller].init();
			controllers[controller].run();
		}
	}

	return {
		run,
	};
};

export default App;
