//@ts-ignore
import { Slider } from "@react-native-assets/slider";
import React from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { CanvasState, ChickenScratchContext } from "../context";

const BASE_BUTTON_HEIGHT = 50;
const BASE_BUTTON_DEFAULT_BOTTOM_MARGIN = 10;
const BASE_BUTTON_SIDE_MARGIN = 10;
const BASE_BUTTON_RADIUS = 10;

const DEFAULT_COLOR_SELECT_SIZE = 50;
const COLOR_PALETTE_SELECT_BACKGROUND_COLOR = "white";

const BASE_BUTTON_COLOR = "#7CA7E0";
const BASE_BUTTON_TEXT_COLOR = "white";
const BASE_BUTTON_TEXT_WEIGHT = 600;
const BASE_BUTTON_HIGHLIGHT = "#A9C0D0";

const SLIDER_BACKGROUND_COLOR = "#F5F6F7";

const SLIDER_THUMB_COLOR = BASE_BUTTON_COLOR;
const SLIDER_THUMB_BORDER_COLOR = "#155965";
const SLIDER_THUMB_SIZE = 25;

const SLIDER_TRACK_COLOR = "#B0B3B7";
const SLIDER_TRACK_BORDER_COLOR = "#888F99";
const SLIDER_TRACK_HEIGHT = 15;

const CLOSE_BUTTON_COLOR = "#d63031";
const CLOSE_BUTTON_HIGHLIGHT = "#ff7675";

interface BaseButtonProps {
	onPress: () => void;
	title: string;
	color?: string;
	margin?: number;
	highlightColor?: string;
}
const BaseButton: React.FC<BaseButtonProps> = (props) => {
	const { onPress, title, color, margin, highlightColor } = props;
	return (
		<TouchableHighlight
			underlayColor={highlightColor ? highlightColor : BASE_BUTTON_HIGHLIGHT}
			onPress={onPress}
			style={{
				height: BASE_BUTTON_HEIGHT,
				backgroundColor: color ? color : BASE_BUTTON_COLOR,
				marginBottom: margin ? margin : BASE_BUTTON_DEFAULT_BOTTOM_MARGIN,
				marginLeft: BASE_BUTTON_SIDE_MARGIN,
				marginRight: BASE_BUTTON_SIDE_MARGIN,
				borderRadius: BASE_BUTTON_RADIUS,

				shadowColor: "#000",
				shadowOffset: {
					width: 0,
					height: 2,
				},
				shadowOpacity: 0.25,
				shadowRadius: 3.84,
				elevation: 3,
			}}>
			<View style={{ flex: 1, justifyContent: "center" }}>
				<Text
					// @ts-ignore
					style={{
						textAlign: "center",
						color: BASE_BUTTON_TEXT_COLOR,
						fontWeight: BASE_BUTTON_TEXT_WEIGHT,
						fontSize: 16,
					}}>
					{title}
				</Text>
			</View>
		</TouchableHighlight>
	);
};

interface UndoButtonProps {}
export const UndoButton: React.FC<UndoButtonProps> = () => {
	const { undo } = React.useContext(ChickenScratchContext);
	return <BaseButton title="Undo" onPress={undo} />;
};

interface RedoPreviousStroke {}
export const RedoButton: React.FC<RedoPreviousStroke> = () => {
	const { redo } = React.useContext(ChickenScratchContext);
	return <BaseButton title="Redo" onPress={redo} />;
};

interface ClearButtonProps {}
export const ClearCanvasButton: React.FC<ClearButtonProps> = () => {
	const { clear } = React.useContext(ChickenScratchContext);
	return <BaseButton title="Clear" onPress={clear} />;
};

interface SaveButton {}
export const SaveButton: React.FC<SaveButton> = () => {
	const { getSvgString } = React.useContext(ChickenScratchContext);
	const handlePressSaveButton = () => {
		console.log(getSvgString());
	};
	return <BaseButton title="Save" onPress={handlePressSaveButton} />;
};

interface ColorSelectorButtonProps {
	colors?: string[];
}
export const ColorSelectorButton: React.FC<ColorSelectorButtonProps> = (
	props
) => {
	const {
		colors = [
			"black",
			"red",
			"green",
			"blue",
			"yellow",
			"orange",
			"violet",
			"purple",
		],
	} = props;
	const { setCurrentStrokeColor } = React.useContext(ChickenScratchContext);
	const [selectorOpen, setSelectorOpen] = React.useState(false);

	const handlePressColorSelectorButton = () => {
		setSelectorOpen(true);
	};

	const selectColor = (color) => {
		setSelectorOpen(false);
		setCurrentStrokeColor(color);
	};

	const styles = StyleSheet.create({
		colorPalette: {
			position: "absolute",
			zIndex: 1,
			top: BASE_BUTTON_HEIGHT,
			width: "100%",
			backgroundColor: COLOR_PALETTE_SELECT_BACKGROUND_COLOR,
		},
		colorSelector: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: DEFAULT_COLOR_SELECT_SIZE / 2,

			justifyContent: "space-evenly",
			paddingLeft: 25,
			paddingRight: 25,
			paddingBottom: 10,
			paddingTop: 10,
		},
	});

	return (
		<View>
			<BaseButton title="Color" onPress={handlePressColorSelectorButton} />
			{selectorOpen && (
				<View style={styles.colorPalette}>
					<View style={styles.colorSelector}>
						{colors.map((color) => (
							<ColorSelect
								key={color}
								color={color}
								onRelease={() => selectColor(color)}
							/>
						))}
					</View>
					<BaseButton
						title="Close"
						onPress={() => setSelectorOpen(false)}
						color={CLOSE_BUTTON_COLOR}
						highlightColor={CLOSE_BUTTON_HIGHLIGHT}
					/>
				</View>
			)}
		</View>
	);

	interface ColorSelectProps {
		color: string;
		onRelease: () => void;

		orient?: "top" | "bottom" | "left" | "right";
		width?: number;
		height?: number;
		round?: boolean;
		radius?: number;
		border?: boolean;
		borderWidth?: number;
	}
	function ColorSelect(props: ColorSelectProps) {
		const {
			onRelease,
			color,
			width = DEFAULT_COLOR_SELECT_SIZE,
			height = DEFAULT_COLOR_SELECT_SIZE,
			round = true,
			border = true,
			borderWidth = 3,
			radius = 0,
		} = props;

		return (
			<TouchableHighlight
				style={{
					width: width,
					height: height,
					borderRadius: round ? width / 2 : radius,
				}}
				onPress={onRelease}>
				<View
					style={{
						width: width,
						height: height,
						backgroundColor: color,
						borderRadius: round ? width / 2 : radius,
						borderColor: "black",
						borderWidth: border ? borderWidth : 0,
					}}
				/>
			</TouchableHighlight>
		);
	}
};

interface WidthSelectorProps {
	min: number;
	max: number;

	includeBackground?: boolean;
}
export const WidthSelectorSlider: React.FC<WidthSelectorProps> = (props) => {
	const { min, max, includeBackground = false } = props;
	const { setCurrentStrokeWidth, getCurrentStrokeWidth } = React.useContext(
		ChickenScratchContext
	);

	const handelValueChange = (value: number) => {
		setCurrentStrokeWidth(value);
	};

	return (
		<View
			style={{
				paddingLeft: 25,
				paddingRight: 25,
				paddingTop: 10,
				paddingBottom: 10,

				backgroundColor: includeBackground
					? SLIDER_BACKGROUND_COLOR
					: "none",
				marginLeft: BASE_BUTTON_SIDE_MARGIN,
				marginRight: BASE_BUTTON_SIDE_MARGIN,
			}}>
			<Text
				// @ts-ignore
				style={{
					fontSize: 16,
					fontWeight: BASE_BUTTON_TEXT_WEIGHT,
					marginBottom: 10,
				}}>
				Width
			</Text>
			<Slider
				key={`slider-${getCurrentStrokeWidth()}`}
				minimumValue={min}
				maximumValue={max}
				value={getCurrentStrokeWidth()}
				step={1}
				thumbTintColor={SLIDER_THUMB_COLOR}
				thumbStyle={{
					borderColor: SLIDER_THUMB_BORDER_COLOR,
					borderWidth: 2,
				}}
				thumbSize={SLIDER_THUMB_SIZE}
				trackHeight={SLIDER_TRACK_HEIGHT}
				maximumTrackTintColor={SLIDER_TRACK_COLOR}
				minimumTrackTintColor={SLIDER_TRACK_COLOR}
				minTrackStyle={{
					borderTopRightRadius: 0,
					borderBottomRightRadius: 0,

					borderColor: SLIDER_TRACK_BORDER_COLOR,
					borderWidth: 2,

					borderRightWidth: 0,
				}}
				maxTrackStyle={{
					borderTopLeftRadius: 0,
					borderBottomLeftRadius: 0,

					borderColor: SLIDER_TRACK_BORDER_COLOR,
					borderWidth: 2,

					borderLeftWidth: 0,
				}}
				onValueChange={handelValueChange}
			/>
		</View>
	);
};

export const ToggleEraseStrokeButton: React.FC = () => {
	const { setStateErase, setStateDraw, getCurrentState, render } =
		React.useContext(ChickenScratchContext);
	const handlePressEraseButton = () => {
		const state = getCurrentState();
		switch (state) {
			case CanvasState.Drawing:
				setStateErase();
				render();
				break;
			case CanvasState.Erasing:
				setStateDraw();
				render();
				break;
			default:
				setStateDraw();
				break;
		}
	};
	return (
		<BaseButton
			title={getCurrentState() === CanvasState.Drawing ? "Erase" : "Draw"}
			onPress={handlePressEraseButton}
		/>
	);
};
