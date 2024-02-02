import React, { useRef } from "react";
import { PanResponder, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";

interface GestureManagerProps {
	shouldMove?: boolean;
	cancelOnLeaveView?: boolean;

	maxFingers?: number | null;
	minFingers?: number | null;

	onStart?: () => void;
	onMove?: (event: any) => void;
	onAllRelease?: () => void;
	onSingleRelease?: () => void;
}

export interface GestureManagerInterface {}

interface GestureManagerProps {
	shouldMove?: boolean;

	maxFingers?: number | null;
	minFingers?: number | null;

	onStart?: () => void;
	onMove?: (event: any) => void;
	onAllRelease?: () => void;
	onSingleRelease?: () => void;
	onLeaveView?: () => void;
}

/**
 * @description A class that detects and manages drag gesture events
 * @property shouldMove Whether or not the gesture manager should respond to drag events
 * @property maxFingers The maximum number of fingers that can be used to drag
 * @property minFingers The minimum number of fingers that can be used to drag
 * @property onGrant A callback function that is called when a drag gesture is detected
 * @property onMove A callback function that is called when a drag gesture is detected
 * @property onAllRelease A callback function that is called when all fingers are released
 * @property onSingleRelease A callback function that is called when a single finger is released
 * @method DragAreaDetection A view placed inside the canvas to detect drag events
 */
export class DragGestureManager implements GestureManagerInterface {
	private _panResponder: any;
	private _previousX: number | null = null;
	private _previousY: number | null = null;
	private _hasNotMeasured = true;
	private _pageX: number | null = null;
	private _pageY: number | null = null;
	private _relX: number | null = null;
	private _relY: number | null = null;
	private _width: number | null = null;
	private _height: number | null = null;
	public dragDetector: PanGestureHandler;

	constructor(props: GestureManagerProps | null = {}) {
		const shouldMove = props?.shouldMove ?? true;
		const maxFingers = props?.maxFingers ?? null;
		const minFingers = props?.minFingers ?? null;
		const cancelOnLeaveView = props?.cancelOnLeaveView ?? true;
		const onStart = props?.onStart ?? (() => {});
		const onMove = props?.onMove ?? (() => {});
		const onAllRelease = props?.onAllRelease ?? (() => {});
		const onSingleRelease = props?.onSingleRelease ?? (() => {});
		const onLeaveView = props?.onLeaveView ?? (() => {});

		this._panResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => {
				return shouldMove;
			},
			onPanResponderGrant: () => {
				onStart();
			},
			onPanResponderMove: (event) => {
				const { pageX: x, pageY: y } = getTouchDataFromNativeEvent(event);
				const numFingers = getNumberOfTouchesFromNativeEvent(event);

				// Check if move is outside of drag area (using pageX and pageY)
				if (!this._hasNotMeasured) {
					const xOutsideDragArea =
						x < this._pageX || x > this._pageX + this._width;
					const yOutsideDragArea =
						y < this._pageY || y > this._pageY + this._height;

					if (xOutsideDragArea || yOutsideDragArea) {
						onLeaveView();
						if (cancelOnLeaveView) {
							this._resetPreviousCoordinates();
							return;
						}
					}
				}

				// Check that move has occurred (if there is a _previousX and _previousY)
				if (fingerHasMoved.call(this)) {
					if (validateNumberOfFingers()) {
						onAllRelease();
						this._resetPreviousCoordinates();
						return;
					}
					this._setPreviousCoordinates(x, y);
					onMove(event);
				}

				function validateNumberOfFingers() {
					return (
						(maxFingers && numFingers > maxFingers) ||
						(minFingers && numFingers < minFingers)
					);
				}

				function fingerHasMoved() {
					return this._previousX !== x && this._previousY !== y;
				}
			},
			onPanResponderRelease: () => {
				onAllRelease();
				this._resetPreviousCoordinates();
			},
			onPanResponderEnd: () => {
				onSingleRelease();
			},
		});

		this.dragDetector = this._panResponder.panHandlers;
	}

	/**
	 * @description A view placed inside the canvas to detect drag events
	 * @returns React Native View component
	 */
	public DragAreaDetection = (): JSX.Element => {
		const boundingBox = useRef(null);
		measure.call(this);
		return (
			<View
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					zIndex: 1000,
				}}
				{...this.dragDetector}
				ref={(view) => (boundingBox.current = view)}
				onLayout={dragAreaCreated}
			/>
		);

		function dragAreaCreated(event: any) {
			// console.log("drag area created");
		}

		function measure() {
			// console.log("measure attempted");
			if (boundingBox.current) {
				boundingBox.current.measure(
					(
						x: number,
						y: number,
						width: number,
						height: number,
						pageX: number,
						pageY: number
					) => {
						this._relX = x;
						this._relY = y;
						this._width = width;
						this._height = height;
						this._pageX = pageX;
						this._pageY = pageY;
						this._hasNotMeasured = false;
						// console.log("measure successful", x, y, width, height);
					}
				);
			}
		}
	};

	private _setPreviousCoordinates(x: number, y: number) {
		this._previousX = x;
		this._previousY = y;
	}
	private _resetPreviousCoordinates() {
		this._previousX = null;
		this._previousY = null;
	}
}

export class TouchData {
	x: number;
	y: number;
	timestamp: number;
	numberOfTouches: number;
	pageX?: number;
	pageY?: number;
	constructor(
		timestamp: number,
		x: number,
		y: number,
		pageX?: number,
		pageY?: number,
		numberOfTouches?: number
	) {
		this.timestamp = timestamp;
		this.x = x;
		this.y = y;
		this.pageX = pageX;
		this.pageY = pageY;
		this.numberOfTouches = numberOfTouches ?? 1;
	}

	distance(touchData: TouchData) {
		return Math.sqrt(
			Math.pow(this.x - touchData.x, 2) + Math.pow(this.y - touchData.y, 2)
		);
	}

	timeDifference(touchData: TouchData) {
		return this.timestamp - touchData.timestamp;
	}
}

/**
 * @description Returns a TouchData object from a native event
 * @param event The native event
 * @returns A TouchData object { timestamp, x, y, pageX, pageY, numberOfTouches }
 */
export function getTouchDataFromNativeEvent(event: any): TouchData {
	const timestamp = getTimestampFromNativeEvent(event);
	const x = getXFromNativeEvent(event);
	const y = getYFromNativeEvent(event);
	const pageX = getPageXFromNativeEvent(event);
	const pageY = getPageYFromNativeEvent(event);
	const numberOfTouches = getNumberOfTouchesFromNativeEvent(event);

	return new TouchData(
		timestamp,
		roundDownToNearestPixel(x),
		roundDownToNearestPixel(y),
		roundDownToNearestPixel(pageX),
		roundDownToNearestPixel(pageY),
		numberOfTouches
	);

	function roundDownToNearestPixel(value: number) {
		return Math.floor(value);
	}
}

function getPageXFromNativeEvent(event: any): number {
	return event.nativeEvent.pageX;
}

function getPageYFromNativeEvent(event: any): number {
	return event.nativeEvent.pageY;
}

function getTimestampFromNativeEvent(event: any): number {
	return event.nativeEvent.timestamp;
}
function getXFromNativeEvent(event: any): number {
	return event.nativeEvent.locationX;
}

function getYFromNativeEvent(event: any): number {
	return event.nativeEvent.locationY;
}

function getNumberOfTouchesFromNativeEvent(event: any): number {
	return event.nativeEvent.touches.length;
}
