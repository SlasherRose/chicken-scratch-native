# chicken-scratch

## Table of Contents

-  [Installation](#installation)
-  [Usage](#usage)
   -  [Basic Setup](#basic-setup)
   -  [Buttons](#buttons)
-  [API Reference](#api-reference)
   -  [Canvas](#canvas)
   -  [ChickenScratchContext](#chickenscratchcontext)
-  [Limitations](#limitations)
-  [License](#license)

`chicken-scratch-native` is a React Native library designed to provide a ultra-minimalistic drawing interface for applications. It features customizable drawing tools, including pen color and width selectors, undo/redo functionality, and the ability to export drawings as SVG strings. This library is perfect for applications requiring user-generated drawings or annotations.

## Installation

To install the `chicken-scratch-native` package, run:

`npm install chicken-scratch-native`

## Usage

To use `chicken-scratch-native` in your project, wrap your app's component tree with the `ChickenScratchProvider` and then use the `Canvas` component where you want the drawing area to be. You can also use the button components provided by the library for drawing controls.

### Basic Setup

Before creating a canvas, wrap your component (or application) with the `ChickenScratchProvider`. Next, include the `Canvas` component where you want the drawing area:

```js
import React from "react";
import { View } from "react-native";
import { Canvas } from "chicken-scratch-native";
function Drawing() {
	return (
		<ChickenScratchContext>
			<View>
				<Canvas width={300} height={500} backgroundColor="#fff" />
			</View>
		</ChickenScratchContext>
	);
}
export default Drawing;
```

### Buttons

Chicken scratch comes with a set of default buttons to help quick start development. To create custom ways to interact with canvas states, please see [Using ChickenScratchContext](#using-chickenscratchcontext)

```js
import React from "react";
import { View } from "react-native";
import {
	Canvas,
	UndoButton,
	RedoButton,
	ClearCanvasButton,
	ColorSelectorButton,
	WidthSelectorSlider,
	ToggleEraseStrokeButton,
} from "chicken-scratch-native";
function DrawingControls() {
	return (
		<View>
            <Canvas width={200} height={200}>
			<UndoButton />
            <RedoButton />
            <ClearCanvasButton />
            <ColorSelectorButton />
			<WidthSelectorSlider min={1} max={10} />
            <ToggleEraseStrokeButton />
		</View>
	);
}
```

### API Reference

#### `Canvas`

| Prop              | Type   | Description                                                                                        |
| ----------------- | ------ | -------------------------------------------------------------------------------------------------- |
| `width`           | number | Width of the canvas.                                                                               |
| `height`          | number | Height of the canvas.                                                                              |
| `fluid`           | bool   | If set, the canvas will fill the container in the X direction (requires a height to still be set). |
| `fill`            | bool   | If set, the canvas will fill in both X and Y directions (requires neither height nor width).       |
| `backgroundColor` | string | Background color of the canvas.                                                                    |

#### `ChickenScratchContext`

This context provides access to drawing functions, canvas manipulation methods, and drawing properties that you can use throughout your application.

**Properties**

| Property                      | Type   | Description                                                                                                                    |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `strokeCollectionInitialized` | number | A value that changes whenever the stroke collection is initialized or overwritten (begins at 0). Useful for detecting changes. |
| `strokes`                     |        | The current collection of drawn strokes.                                                                                       |
| `currentStroke`               |        | The stroke currently being drawn.                                                                                              |

**Functions**

| Function                                                        | Description                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `overwriteStrokeCollection(strokeCollection: StrokeCollection)` | Overwrites the current stroke collection with a new one. If no stroke collection is set, then one will be created. |
| `draw(x: number, y: number)`                                    | Begins or continues drawing a stroke at the specified coordinates.                                                 |
| `endDraw()`                                                     | Finalizes the current stroke and adds it to the collection.                                                        |
| `removeStroke(x: number, y: number)`                            | Removes a stroke at the specified coordinates.                                                                     |
| `clear()`                                                       | Clears the canvas of all strokes.                                                                                  |
| `setStateErase()`                                               | Sets the canvas state to erasing.                                                                                  |
| `setStateDraw()`                                                | Sets the canvas state to drawing.                                                                                  |
| `getCurrentState()`                                             | Returns the current canvas state, indicating whether the user is drawing or erasing.                               |
| `undo()`                                                        | Reverts the last action (draw, erase, or clear).                                                                   |
| `redo()`                                                        | Reapplies an action that was previously undone.                                                                    |
| `getCurrentStrokeColor()`                                       | Returns the current stroke color.                                                                                  |
| `setCurrentStrokeColor(color: string)`                          | Sets the current stroke color.                                                                                     |
| `getCurrentStrokeWidth()`                                       | Returns the current stroke width.                                                                                  |
| `setCurrentStrokeWidth(width: number)`                          | Sets the current stroke width.                                                                                     |
| `getCanvasWidth()`                                              | Returns the width of the canvas.                                                                                   |
| `getCanvasHeight()`                                             | Returns the height of the canvas.                                                                                  |
| `getSvgString()`                                                | Returns an SVG string representation of the current drawing.                                                       |
| `render()`                                                      | Forces the canvas to re-render, useful for applying changes that don't automatically trigger a re-render.          |

#### Using ChickenScratchContext

To interact with the drawing functionality, your components need to access `ChickenScratchContext`. Here's an example of using some context functions

```js
import React, { useContext } from "react";
import { View, Button } from "react-native";
import { ChickenScratchContext } from "chicken-scratch-native";

// Note: to work properly, DrawingControls must be placed somewhere in the <ChickenScratchProvider> tree along side the canvas
const DrawingControls = () => {
	const { undo, redo, clear } = useContext(ChickenScratchContext);

	return (
		<View>
			<Button title="Undo" onPress={undo} />
			<Button title="Redo" onPress={redo} />
			<Button title="Clear" onPress={clear} />
		</View>
	);
};
```

## Limitations

### Feature Set

Being ultra-minimalistic, `chicken-scratch-native` lacks many advanced features found in more comprehensive drawing libraries, such as layer management, shapes, brush stroke, fill, text, and image import/export capabilities. It is primarily useful for situations where user input is required in the form of a sketch, such as a signature or whiteboard-style drawing game. In the future, some of these features may be added to improve quality of life for developers

### Output

Currently, `chicken-scratch-native` can only output an SVG string of a user's drawing. This choice prioritizes ease of integration and scalability of output across different platforms and screen sizes. However, it may limit how output can be manipulated or used. Further updates may expand the list of available outputs

### Performance

Chicken-scratch-native employs a rendering mechanism that triggers re-renders for each frame during user interaction with the Canvas component. This approach, while ensuring up-to-date visual feedback, can be resource-intensive. Despite this, our testing on a range of devices, including lower-end Android models, has shown that the library maintains a respectable performance level with minimal impact on usability.

The library currently utilizes a linear interpolation method to connect points, which simplifies implementation but may result in less smooth curves and edges in certain drawings. This effect is most noticeable in fast or complex movements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
