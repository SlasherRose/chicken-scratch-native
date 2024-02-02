enum ActionType {
	Draw,
	RemoveStroke,
	Clear,
}

class Action {
	type: ActionType;
	strokes?: Stroke | Stroke[];

	constructor(type: ActionType, strokes?: Stroke | Stroke[]) {
		this.type = type;
		this.strokes = strokes;
	}
}

interface StrokeCollectionProps {
	strokes?: Stroke[];
	maxPrecision?: number;
	currentStroke?: Stroke;
	canvasWidth: number;
	canvasHeight: number;
}

/**
 * @description A collection of strokes
 * @property strokes An array of previously drawn strokes
 * @property currentStroke The stroke currently being drawn
 * @property maxPrecision The maximum number of decimal places to round to
 * @property canvasWidth The width of the canvas
 * @property canvasHeight The height of the canvas
 * @method toSVG Converts the strokes into an SVG string
 * @method copyFrom Creates a deep copy of a StrokeCollection
 * @method addStroke Adds a completed stroke to the list of strokes
 * @method draw Adds a point to the current stroke
 * @method endDraw Appends the current stroke to the list of strokes and clears the current stroke
 * @method undo Undoes the last stroke
 * @method redo Redoes the last undone stroke
 * @method clear Clears the strokes
 * @method findStrokeAtPoint Finds a stroke at a given point
 */
export class StrokeCollection {
	strokes?: Stroke[] = [];
	currentStroke: Stroke | null = null;
	maxPrecision?: number;
	canvasWidth?: number;
	canvasHeight?: number;
	maxUndo: number = 100;

	constructor(props: StrokeCollectionProps) {
		const {
			strokes = [],
			maxPrecision = 1,
			canvasWidth,
			canvasHeight,
			currentStroke,
		} = props;
		this.strokes = strokes;
		this.maxPrecision = maxPrecision;
		const trimmedWidth = Number(canvasWidth.toFixed(this.maxPrecision));
		const trimmedHeight = Number(canvasHeight.toFixed(this.maxPrecision));
		this.canvasWidth = canvasWidth ? trimmedWidth : 0;
		this.canvasHeight = canvasHeight ? trimmedHeight : 0;
		this.currentStroke = currentStroke ? currentStroke : null;
	}
	actionPool = [];
	undoPool = [];

	/**
	 * @description Converts the strokes into an SVG string
	 * @returns A string of SVG markup representing the strokes in the collection
	 */
	toSVG(): any {
		let svg = `<svg viewBox="0 0 ${this.canvasWidth} ${this.canvasHeight}" width="${this.canvasWidth}" height="${this.canvasHeight}">`;
		this.strokes.forEach((stroke) => {
			svg += `<path d="${stroke.getSVGPath()}" stroke="${
				stroke.color
			}" stroke-width="${stroke.width}" fill="none" />`;
		});
		svg += "</svg>";
		return svg;
	}

	/**
	 * @description Creates a deep copy of a StrokeCollection
	 * @param other The StrokeCollection to copy from
	 */
	copyFrom(other: StrokeCollection) {
		this.strokes = other.strokes;
		this.currentStroke = other.currentStroke;
	}

	/**
	 * @description Adds a full stroke (a collection of points) to the list of strokes
	 * @param stroke The stroke to add
	 */
	addStroke(stroke: Stroke) {
		// Trim the stroke's points to the maximum precision
		stroke.points.forEach((point) => {
			point.x = Number(point.x.toFixed(this.maxPrecision));
			point.y = Number(point.y.toFixed(this.maxPrecision));
		});

		// Add the stroke (with trimmed points)
		this.strokes.push(stroke);

		// enables undo on this feature
		this._trackUserActions(new Action(ActionType.Draw, stroke));
	}

	/**
	 * @description Adds a point to the current stroke
	 * @param x The x coordinate of the point
	 * @param y The y coordinate of the point
	 * @param color The color of the stroke
	 * @param width The width of the stroke
	 */
	draw(x: number, y: number, color: string = "black", width: number = 1) {
		this._prepForUserAction();

		// Begin the stroke if this is the first frame of drawing
		if (!this.currentStroke) {
			this.currentStroke = new Stroke({ x, y, width, color });
		} else {
			// Add the point to the current stroke
			this.currentStroke.addPoint(x, y);
		}
	}

	/**
	 * @description Appends the current stroke to the list of strokes and clears the current stroke
	 */
	endDraw() {
		if (this.currentStroke) {
			this.addStroke(this.currentStroke);
			this.currentStroke = null;
		}
	}

	/*
	 * @description Undoes the last stroke
	 */
	undo() {
		const action = this.actionPool.pop();
		if (action) {
			switch (action.type) {
				case ActionType.Draw:
					this.strokes = this.strokes.filter((s) => s !== action.strokes);
					break;
				case ActionType.RemoveStroke:
					this.strokes.push(action.strokes);
					break;
				case ActionType.Clear:
					action.strokes.forEach((stroke) => {
						this.strokes.push(stroke);
					});
					break;
			}
		}
		this.undoPool.push(action);
	}

	/**
	 * @description Re-adds an undone stroke
	 */
	redo() {
		const action = this.undoPool.pop();
		if (action) {
			switch (action.type) {
				case ActionType.Draw:
					this.strokes.push(action.strokes);
					break;
				case ActionType.RemoveStroke:
					this.strokes = this.strokes.filter((s) => s !== action.strokes);
					break;
				case ActionType.Clear:
					action.strokes.forEach((stroke) => {
						this.strokes = this.strokes.filter((s) => s !== stroke);
					});
					break;
			}
			this.actionPool.push(action);
		}
	}

	/*
	 * @description Clears the strokes collection and the current stroke
	 */
	clear() {
		this._prepForUserAction();

		// enable undo on this feature
		this._trackUserActions(new Action(ActionType.Clear, this.strokes));

		this.strokes = [];
		this.currentStroke = null;
	}

	/*
	 * @description Removes a stroke at a given point
	 * @param x The x coordinate of the point
	 * @param y The y coordinate of the point
	 */
	removeStroke(x: number, y: number) {
		this._prepForUserAction();
		const stroke = this.findStrokeAtPoint(x, y);
		if (stroke) {
			this.strokes = this.strokes.filter((s) => s !== stroke);

			// enable undo on this feature
			this._trackUserActions(new Action(ActionType.RemoveStroke, stroke));
		}
	}

	/*
	 * @description Finds a stroke at a given point
	 * @param x The x coordinate of the point
	 * @param y The y coordinate of the point
	 * @param findAll If true, returns all strokes at the given point. if false, gives just the most recent
	 * @returns A stroke or an array of strokes or null if no stroke is found
	 */
	findStrokeAtPoint(
		x: number,
		y: number,
		findAll: boolean = false
	): Stroke | Stroke[] | null {
		// Sanitize the coordinates
		x = Number(x.toFixed(this.maxPrecision));
		y = Number(y.toFixed(this.maxPrecision));

		// Find the stroke with only one point that matches the given coordinates
		// Interpolates between two points with a bounding rectangle
		// (NOTE: This works because all strokes are made up of SHORT lines)
		const strokes: Stroke[] = [];

		for (let i = this.strokes.length - 1; i >= 0; i--) {
			const stroke = this.strokes[i];
			const { points, width } = stroke;
			for (let i = 0; i < points.length - 1; i++) {
				const point1 = points[i];
				const point2 = points[i + 1];

				// check between point1 and point2 to see if it contains the point
				const minX = Math.min(point1.x, point2.x);
				const maxX = Math.max(point1.x, point2.x);
				const minY = Math.min(point1.y, point2.y);
				const maxY = Math.max(point1.y, point2.y);

				// account for width by slightly expanding the search area
				if (
					x >= minX - width &&
					x <= maxX + width &&
					y >= minY - width &&
					y <= maxY + width
				) {
					if (!findAll) {
						return stroke;
					}
					strokes.push(stroke);
				}
			}
		}

		if (strokes.length === 0) {
			return null;
		}

		return strokes;
	}

	// Add this to the action pool to track what actions the user has taken
	// This enables undo/redo functionality
	_trackUserActions(actionType: Action) {
		// Limit the number of undos possible (default to 100)
		if (this.actionPool.length >= this.maxUndo) {
			this.actionPool.shift();
		}
		this.actionPool.push(actionType);
	}

	// Do this before every user action (draw, remove, clear)
	_prepForUserAction() {
		// check the undo pool, if there's a stroke there clear the pool
		// This is to prevent redoing unintended strokes
		if (this.undoPool.length > 0) {
			this.undoPool = [];
		}
	}

	clone() {
		return new StrokeCollection({
			strokes: this.strokes,
			maxPrecision: this.maxPrecision,
			canvasWidth: this.canvasWidth,
			canvasHeight: this.canvasHeight,
		});
	}
}

interface StrokeProps {
	x: number;
	y: number;
	width?: number;
	color?: string;
}
/**
 * @description A collection of points that make up the path of a stroke
 * @property points An array of points
 * @property width The width of the stroke
 * @property color The color of the stroke
 * @method addPoint Adds a point to the stroke
 * @method getSVGPath Converts the stroke into an SVG path string
 */
export class Stroke {
	points: { x: number; y: number }[] = [];
	width: number;
	color: string = "#000";

	constructor(props: StrokeProps) {
		const { x, y, width = 1, color = "#000" } = props;
		this.points.push({ x, y });
		this.width = width;
		this.color = color;
	}

	addPoint(x: number, y: number) {
		this.points.push({ x, y });
	}

	getSVGPath() {
		// Prevent drawing a stroke with only one point
		if (this.points.length <= 1) {
			return "";
		}

		let path = "";
		this.points.forEach((point, index) => {
			const { x, y } = point;
			// If this is the first point, use an M (move) command
			// to move the cursor to the first point
			if (index === 0) {
				path += `M${x} ${y}`;
			}
			// Otherwise use an L (line) command to draw a line
			// connecting the previous point to this point
			else {
				path += ` L${x} ${y}`;
			}
		});
		return path;
	}
}
