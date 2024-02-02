//@ts-ignore
import React, { useCallback, useRef, useState } from "react";
import { StrokeCollection } from "./structures";

const LOOP_RENDER_COUNT = 10000;

export enum CanvasState {
	Drawing,
	Erasing,
}

interface ChickenScratchContextProps {
	// Stroke Collection
	overwriteStrokeCollection?: (strokeCollection: StrokeCollection) => void;
	strokeCollectionInitialized?: number;
	strokes?: any;
	currentStroke?: any;

	// Canvas Manipulation Methods
	undo?: () => void;
	redo?: () => void;
	draw?: (x: number, y: number) => void;
	endDraw?: () => void;
	removeStroke?: (x: number, y: number) => void;
	clear?: () => void;

	// Handle state changes
	getCurrentState?: () => CanvasState;
	setStateErase?: () => void;
	setStateDraw?: () => void;

	// Canvas Drawing properties
	getCurrentStrokeColor?: () => string;
	setCurrentStrokeColor?: (color: string) => void;
	getCurrentStrokeWidth?: () => number;
	setCurrentStrokeWidth?: (width: number) => void;

	// Canvas dimensions
	getCanvasWidth?: () => number;
	getCanvasHeight?: () => number;

	// Data retrieval
	getSvgString?: () => string;

	// force re-render
	render?: () => void;
}
export const ChickenScratchContext =
	React.createContext<ChickenScratchContextProps>({
		// Initialize and detect changes to the stroke collection
		overwriteStrokeCollection: () => {},
		strokeCollectionInitialized: 0,

		// Retrieve stroke data
		strokes: null,
		currentStroke: null,

		// Actions
		undo: () => {},
		redo: () => {},
		draw: () => {},
		endDraw: () => {},
		clear: () => {},
		removeStroke: () => {},

		// State Changes
		setStateDraw: () => {},
		setStateErase: () => {},
		getCurrentState: () => CanvasState.Drawing,

		// Drawing properties
		getCurrentStrokeColor: () => "#000",
		setCurrentStrokeColor: (color: string) => {},
		getCurrentStrokeWidth: () => 4,
		setCurrentStrokeWidth: (width: number) => {},

		// Canvas dimensions
		getCanvasHeight: () => 0,
		getCanvasWidth: () => 0,

		// Data retrieval
		getSvgString: () => "<svg></svg>",

		// force re-render
		render: () => {},
	});

interface ChickenScratchProviderProps {
	children: React.ReactNode;
}
const ChickenScratchProvider: React.FC<ChickenScratchProviderProps> = ({
	children,
}) => {
	// Store the data for the strokes that the user is drawing in
	// a single object that is mutated over time. The render()
	// function will force a re-render
	const [strokeCollection, setStrokeCollection] =
		useState<StrokeCollection | null>(null);

	// Keep track of the user-set states of the canvas
	const initCanvasValues = {
		strokeColor: "#000",
		strokeWidth: 4,
		state: CanvasState.Drawing,
	};
	const strokeWidth = useRef(initCanvasValues.strokeWidth);
	const strokeColor = useRef(initCanvasValues.strokeColor);
	const state = useRef(initCanvasValues.state);

	const setStrokeWidth = (width: number) => {
		strokeWidth.current = width;
	};

	const setStrokeColor = (color: string) => {
		strokeColor.current = color;
	};

	const setState = (newState: CanvasState) => {
		state.current = newState;
	};

	// Render uses the useState hook to force a re-render
	const [renderCount, forceRender] = useState(0);
	const render = useCallback(() => {
		forceRender((prev) => (prev + 1) % LOOP_RENDER_COUNT);
	}, []);

	// strokeCollectionInitialized is used to detect when the stroke collection has
	// been initialized (or overwritten)
	const [strokeCollectionInitialized, setStrokeCollectionInitialized] =
		useState(0);

	// All methods that will be available to the user of the context
	const contextValues = {
		overwriteStrokeCollection: (strokeCollection: StrokeCollection) => {
			setStrokeCollection(strokeCollection);
			setStrokeCollectionInitialized((prev) => prev + 1);
		},
		strokeCollectionInitialized,
		strokes: strokeCollection?.strokes,
		currentStroke: strokeCollection?.currentStroke,

		draw: useCallback(
			(x, y) => {
				if (strokeCollection) {
					strokeCollection.draw(
						x,
						y,
						strokeColor.current,
						strokeWidth.current
					);
				}
				render();
			},
			[strokeCollection]
		),

		endDraw: useCallback(() => {
			if (strokeCollection) {
				strokeCollection.endDraw();
				render();
			}
		}, [strokeCollection]),

		removeStroke: useCallback(
			(x, y) => {
				if (strokeCollection) {
					strokeCollection.removeStroke(x, y);
					render();
				}
			},
			[strokeCollection]
		),

		undo: useCallback(() => {
			if (strokeCollection) {
				strokeCollection.undo();
				render();
			}
		}, [strokeCollection]),

		redo: useCallback(() => {
			if (strokeCollection) {
				strokeCollection.redo();
				render();
			}
		}, [strokeCollection]),

		clear: useCallback(() => {
			if (strokeCollection) {
				strokeCollection.clear();
				render();
			}
		}, [strokeCollection]),

		setStateDraw: useCallback(() => {
			setState(CanvasState.Drawing);
		}, []),

		setStateErase: useCallback(() => {
			setState(CanvasState.Erasing);
		}, []),

		getCurrentState: useCallback(() => {
			return state.current;
		}, []),

		setCurrentStrokeColor: useCallback((color) => setStrokeColor(color), []),
		setCurrentStrokeWidth: useCallback((width) => setStrokeWidth(width), []),

		getCurrentStrokeColor: () => strokeColor.current,
		getCurrentStrokeWidth: () => strokeWidth.current,

		getCanvasWidth: useCallback(() => {
			if (strokeCollection) {
				return strokeCollection.canvasWidth;
			}
			return 0;
		}, [strokeCollection]),

		getCanvasHeight: useCallback(() => {
			if (strokeCollection) {
				return strokeCollection.canvasHeight;
			}
			return 0;
		}, [strokeCollection]),

		getSvgString: useCallback(() => {
			if (strokeCollection) {
				return strokeCollection.toSVG();
			}
			return "<svg></svg>";
		}, [strokeCollection]),

		render,
	};
	return (
		<ChickenScratchContext.Provider value={contextValues}>
			{children}
		</ChickenScratchContext.Provider>
	);
};

export default ChickenScratchProvider;
