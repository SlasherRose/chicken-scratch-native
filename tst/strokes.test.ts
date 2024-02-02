import { StrokeCollection } from "../src/chicken-scratch/structures";

const POINT_1 = {
	x: 10,
	y: 20,
};
const POINT_2 = {
	x: 20,
	y: 30,
};
const POINT_3 = {
	x: 30,
	y: 40,
};
const POINT_4 = {
	x: 40,
	y: 50,
};

const STROKE_1 = {
	points: [POINT_1, POINT_2],
	color: "red",
	width: 2,
};

const STROKE_2 = {
	points: [POINT_3, POINT_4],
	color: "blue",
	width: 3,
};

const CANVAS = {
	width: 100,
	height: 100,
};

const ACTION_DRAW = 0;
const ACTION_ERASE = 1;
const ACTION_CLEAR = 2;
let collection: StrokeCollection;
const drawStroke1 = () => {
	collection.draw(POINT_1.x, POINT_1.y, STROKE_1.color, STROKE_1.width);
	collection.draw(POINT_2.x, POINT_2.y, STROKE_1.color, STROKE_1.width);
};

const drawStroke2 = () => {
	collection.draw(POINT_3.x, POINT_3.y, STROKE_2.color, STROKE_2.width);
	collection.draw(POINT_4.x, POINT_4.y, STROKE_2.color, STROKE_2.width);
};

const addStroke1 = () => {
	// @ts-ignore (the test obj is structured as a stroke object)
	collection.addStroke(STROKE_1);
};

const addStroke2 = () => {
	// @ts-ignore (the test obj is structured as a stroke object)
	collection.addStroke(STROKE_2);
};

describe("StrokeCollection actions", () => {
	beforeEach(() => {
		collection = new StrokeCollection({
			canvasWidth: CANVAS.width,
			canvasHeight: CANVAS.height,
		});
	});

	it("should initialize correctly", () => {
		expect(collection.strokes).toEqual([]);
		expect(collection.currentStroke).toBe(null);

		expect(collection.canvasWidth).toBe(CANVAS.width);
		expect(collection.canvasHeight).toBe(CANVAS.height);
	});

	it("should correctly start a new stroke with draw method", () => {
		drawStroke1();
		// Ensure that the draw function initializes a new stroke correctly
		expect(collection.currentStroke).not.toBeNull();
		expect(collection.currentStroke.points).toContainEqual(POINT_1);
		expect(collection.currentStroke.points).toContainEqual(POINT_2);
		expect(collection.currentStroke.color).toEqual(STROKE_1.color);
		expect(collection.currentStroke.width).toEqual(STROKE_1.width);

		// Ensure that the draw function ONLY goes to the current stroke
		expect(collection.strokes.length).toBe(0);
	});

	it("should end the current stroke correctly", () => {
		drawStroke1();
		// Check that draw function initializes a new stroke correctly
		expect(collection.currentStroke.points).toContainEqual(POINT_1);
		expect(collection.currentStroke.points).toContainEqual(POINT_2);
		// Check that no strokes have been added yet
		expect(collection.strokes.length).toBe(0);

		// End the draw
		collection.endDraw();

		// Ensure that the current stroke is added to the collection
		// And then cleared
		expect(collection.currentStroke).toBe(null);
		expect(collection.strokes.length).toBe(1);
	});

	it("should add a stroke correctly", () => {
		addStroke1();

		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0].points).toEqual(STROKE_1.points);
		expect(collection.strokes[0].color).toEqual(STROKE_1.color);
		expect(collection.strokes[0].width).toEqual(STROKE_1.width);
	});

	it("should clear the strokes", () => {
		addStroke1();
		expect(collection.strokes.length).toBe(1);

		// Clear the strokes
		collection.clear();
		expect(collection.strokes).toEqual([]);
	});

	it("should remove a stroke", () => {
		addStroke1();
		expect(collection.strokes.length).toBe(1);

		// Remove the stroke
		collection.removeStroke(POINT_1.x, POINT_1.y);
		expect(collection.strokes.length).toBe(0);
	});

	it("should create add to the action pool for clear, draw, and erase (the undoable actions)", () => {
		// Draw a stroke
		drawStroke1();
		collection.endDraw(); // registers the stroke + the action
		// Erase a stroke
		collection.removeStroke(POINT_1.x, POINT_1.y);

		// Add a stroke (this should be registered as the same action as drawing a stroke)
		addStroke2();
		// Clear the strokes
		collection.clear();

		// Check the action pool
		expect(collection.actionPool.length).toBe(4);
		expect(collection.actionPool[0].type).toBe(ACTION_DRAW);
		expect(collection.actionPool[0].strokes).toEqual(STROKE_1);

		expect(collection.actionPool[1].type).toBe(ACTION_ERASE);

		expect(collection.actionPool[2].type).toBe(ACTION_DRAW);
		expect(collection.actionPool[2].strokes).toEqual(STROKE_2);

		expect(collection.actionPool[3].type).toBe(ACTION_CLEAR);
		expect(collection.actionPool[3].strokes).toEqual([STROKE_2]);
	});

	it("should not erase when the stroke is not found", () => {
		addStroke1();
		expect(collection.strokes.length).toBe(1);

		// Remove the stroke
		collection.removeStroke(POINT_3.x, POINT_3.y);
		expect(collection.strokes.length).toBe(1);
	});
});

describe("StrokeCollection class - undo/redo", () => {
	beforeEach(() => {
		collection = new StrokeCollection({
			canvasWidth: CANVAS.width,
			canvasHeight: CANVAS.height,
		});

		// Create some strokes to redo
		addStroke1();
		addStroke2();
	});

	it("should undo the last action (draw)", () => {
		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0]).toEqual(STROKE_1);
	});

	it("should last action (erase)", () => {
		// Erase the last action
		collection.removeStroke(POINT_3.x, POINT_3.y);
		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0]).toEqual(STROKE_1);

		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[1]).toEqual(STROKE_2);
	});

	it("should undo the last action (clear)", () => {
		// Clear the strokes
		collection.clear();
		expect(collection.strokes).toEqual([]);

		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[0]).toEqual(STROKE_1);
		expect(collection.strokes[1]).toEqual(STROKE_2);
	});

	it("should redo on draw", () => {
		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0]).toEqual(STROKE_1);

		// Redo the last action
		collection.redo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[1]).toEqual(STROKE_2);
	});

	it("should redo on erase", () => {
		// Erase the last action
		collection.removeStroke(POINT_3.x, POINT_3.y);
		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0]).toEqual(STROKE_1);

		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[1]).toEqual(STROKE_2);

		// Redo the last action
		collection.redo();
		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0]).toEqual(STROKE_1);
	});

	it("should redo on clear", () => {
		// Clear the strokes
		collection.clear();
		expect(collection.strokes).toEqual([]);

		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[0]).toEqual(STROKE_1);
		expect(collection.strokes[1]).toEqual(STROKE_2);

		// Redo the last action
		collection.redo();
		expect(collection.strokes).toEqual([]);
	});

	it("should not redo after a new action (draw)", () => {
		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(1);
		expect(collection.strokes[0]).toEqual(STROKE_1);

		// Draw a new stroke
		drawStroke1();
		collection.endDraw();

		// Attempt redo on empty pool
		collection.redo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[1]).toEqual(STROKE_1);
	});

	it("should not redo after a new action (erase)", () => {
		collection.undo();
		expect(collection.strokes.length).toBe(1);

		collection.removeStroke(POINT_1.x, POINT_1.y);
		expect(collection.strokes.length).toBe(0);

		// Redo the last action (should not redo the erase action)
		collection.redo();
		expect(collection.strokes.length).toBe(0);
	});

	it("should not redo after a new action (clear)", () => {
		// Clear the strokes
		collection.clear();
		expect(collection.strokes).toEqual([]);

		// Undo the last action
		collection.undo();
		expect(collection.strokes.length).toBe(2);
		expect(collection.strokes[0]).toEqual(STROKE_1);
		expect(collection.strokes[1]).toEqual(STROKE_2);

		// Draw a new stroke
		drawStroke1();
		collection.endDraw();

		// Attempt redo on empty pool
		collection.redo();
		expect(collection.strokes.length).toBe(3);
		expect(collection.strokes[2]).toEqual(STROKE_1);
	});
});
