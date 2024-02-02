import React, { useCallback, useContext, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
	DragGestureManager,
	getTouchDataFromNativeEvent,
} from "../../gesture-manager/gesture-manager";
import { CanvasState, ChickenScratchContext } from "../context";
import { StrokeCollection } from "../structures";

interface CanvasProps {
	width?: number;
	height?: number;
	backgroundColor?: string;
	fluid?: boolean;
	fill?: boolean;
}

/**
 * @description A factory for creating a Canvas component
 * @param width The width of the canvas
 * @param height The height of the canvas
 * @param fluid Whether the canvas should auto fill width
 * @param fill Whether the canvas should fill the parent container
 * @param backgroundColor The background color of the canvas
 * @returns
 */
const CanvasFactory: React.FC<CanvasProps> = ({
	width: userSetWidth,
	height: userSetHeight,
	fluid = false,
	fill = false,
	backgroundColor = "#fff",
}) => {
	const [dimensionsHaveChanged, setDimensionsHaveChanged] = React.useState(0);

	const triggerDimensionsChange = () => {
		setDimensionsHaveChanged((prev) => prev + 1);
	};

	return (
		<CanvasFC
			key={dimensionsHaveChanged}
			width={userSetWidth}
			height={userSetHeight}
			fluid={fluid}
			fill={fill}
			viewBackgroundColor={backgroundColor}
			dimensionChangeTrigger={triggerDimensionsChange}
		/>
	);
};

// This is the actual Canvas object. It has been separated from the factory
// to allow for re-rendering when the dimensions change.
const CanvasFC: React.FC<any> = ({
	width: userSetWidth,
	height: userSetHeight,
	fluid = false,
	fill = false,
	viewBackgroundColor = "#fff",
	dimensionChangeTrigger,
}) => {
	// Retrieve all necessary data from the context
	const {
		draw,
		removeStroke,
		endDraw,
		overwriteStrokeCollection,
		strokeCollectionInitialized,
		getCurrentState,
		strokes = [],
		currentStroke,
	} = useContext(ChickenScratchContext);

	const [gestureManager, setGestureManager] = React.useState(null);
	const [layoutTriggered, setLayoutTriggered] = React.useState(false);

	const canvasDimensions = React.useRef({
		width: userSetWidth,
		height: userSetHeight,
	});

	const [measurementsTaken, setMeasurementsTaken] = React.useState(false);

	// Run var check on width and height
	// Begin the process to measure the canvas if fluid or fill is set
	useEffect(() => {
		if (typeof userSetWidth !== "number") {
			if (fluid || fill) {
				// @ts-ignore (this is a temporary assignment used to set the canvas dimensions before measuring and rendering)
				canvasDimensions.current.width = "100%";
			} else {
				console.warn(
					"Canvas width must be a number (or fluid or fill must be set). Defaulting to 100"
				);
				canvasDimensions.current.width = 100;
			}
		}
		if (typeof userSetHeight !== "number") {
			if (fill) {
				// @ts-ignore (this is a temporary assignment used to set the canvas dimensions before measuring and rendering)
				canvasDimensions.current.height = "100%";
			} else {
				console.warn(
					"Canvas height must be a number (or fill must be set). Defaulting to 100"
				);
				canvasDimensions.current.height = 100;
			}
		}
	}, []);

	// Measure the canvas when the layout is triggered
	// If fluid or fill is set, this will result in an actual pixel value
	// that can be used to set the SVG canvas dimensions
	const canvasRef = useCallback(
		(canvas) => {
			canvas?.measure((x, y, width, height, pageX, pageY) => {
				if (width && height) {
					canvasDimensions.current.width = width;
					canvasDimensions.current.height = height;

					initializeStrokeCollection();
					setMeasurementsTaken(true);
				}
			});
		},
		[layoutTriggered]
	);

	// Initialize the stroke collection on first render
	// if the actual dimensions are available
	useEffect(() => {
		if (
			typeof canvasDimensions.current.width !== "number" ||
			typeof canvasDimensions.current.height !== "number"
		) {
			return;
		}
		initializeStrokeCollection();
	}, []);

	// Create a gesture manager when the stroke collection is initialized
	// This will keep the references to the stroke collection in the gesture manager
	// consistent with the current stroke collection
	useEffect(() => {
		setGestureManager(createGestureManager());
	}, [strokeCollectionInitialized]);

	// Detect change in the userSetWidth and userSetHeight
	useEffect(() => {
		if (measurementsTaken) {
			dimensionChangeTrigger();
		}
	}, [userSetWidth, userSetHeight, fluid, fill, viewBackgroundColor]);

	// Create background and user input styles
	const styles = StyleSheet.create({
		canvasBackground: {
			position: "absolute",
			width: canvasDimensions.current.width,
			height: canvasDimensions.current.height,
			backgroundColor: viewBackgroundColor,
		},
		userInput: {
			position: "relative",
			width: canvasDimensions.current.width,
			height: canvasDimensions.current.height,
		},
	});

	// Trigger the layout event
	const onLayout = () => {
		if (!layoutTriggered) {
			setLayoutTriggered(true);
		}
	};

	return (
		<View>
			<View
				style={styles.canvasBackground}
				ref={canvasRef}
				onLayout={onLayout}
			/>
			<View style={styles.userInput}>
				<Drawing
					strokes={strokes}
					currentStroke={currentStroke}
					canvasRef={canvasDimensions}
				/>
				{gestureManager && <gestureManager.DragAreaDetection />}
			</View>
		</View>
	);

	// Create a gesture manager to detect drag events and bind them
	// to the StrokeCollection data
	function createGestureManager() {
		return new DragGestureManager({
			maxFingers: 1,
			onMove: (event: any) => {
				if (!strokeCollectionInitialized) {
					console.warn("stroke collection is not initialized");
				}

				const { x, y } = getTouchDataFromNativeEvent(event);

				// Check the state and determine what kind of change is being made
				const state = getCurrentState();
				switch (state) {
					case CanvasState.Drawing:
						draw(x, y);
						break;
					case CanvasState.Erasing:
						removeStroke(x, y);
						break;
				}
			},
			onAllRelease: () => {
				if (!strokeCollectionInitialized) {
					console.warn("stroke collection is not initialized");
				}
				endDraw();
			},
			onLeaveView: () => {
				endDraw();
			},
		});
	}

	// Get the actual dimensions of the canvas
	function initializeStrokeCollection() {
		if (strokeCollectionInitialized > 0) {
			return;
		}
		const newCanvas = new StrokeCollection({
			canvasWidth: canvasDimensions.current.width,
			canvasHeight: canvasDimensions.current.height,
		});
		overwriteStrokeCollection(newCanvas);
	}
};

const Drawing = ({ canvasRef, strokes, currentStroke }) => {
	return (
		<Svg width={canvasRef.current.width} height={canvasRef.current.height}>
			{/* Draw all previous strokes */}
			{strokes.map((stroke, i) => {
				return (
					<Path
						key={i}
						d={stroke.getSVGPath()}
						stroke={stroke.color}
						strokeWidth={stroke.width}
						fill="none"
					/>
				);
			})}

			{/* Draw the current stroke */}
			{currentStroke && (
				<Path
					d={currentStroke.getSVGPath()}
					stroke={currentStroke.color}
					strokeWidth={currentStroke.width}
					fill="none"
				/>
			)}
		</Svg>
	);
};

const Canvas = CanvasFactory;
export default Canvas;
