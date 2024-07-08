import { TextStyle, ViewProps, ViewStyle } from "react-native";
import { NumberProp, TextProps } from "react-native-svg";

export enum TYPE {
    QUADRATIC_BEZIER,
    CUBIC_BEZIER,
    LINE
}
export enum POSITION {
    TOP_LEFT,
    BOTTOM_LEFT,
    TOP_RIGHT,
    BOTTOM_RIGHT
}
export type CommonProps = {
    hideDot?: boolean;
    dotColor?: string;
    dotOpacity?: number;
    dotRadius?: number;
    dotStrokeColor?: string;
    dotStrokeWidth?: number;
    disableArea?: boolean;
    disableMasking?: boolean;
    areaGradients?: AreaGradient[];
    areaColor?: string;
    areaOpacity?: number;
    lineColor?: string;
    lineWidth?: number;
    hideLine?: boolean;
    areaFill?: string
}
export type Dataset = CommonProps & {
    values: number[];
}
export type AreaGradient = {
    offset: number;
    color: string;
    opacity: number;
}
export interface LineChartProps extends CommonProps{
    datasets: Dataset[];
    height: number;
    width: number;
    horizontalLineCount?: number;
    svgPaddingLeft?: number;
    svgPaddingRight?: number;
    svgPaddingTop?: number;
    svgPaddingBottom?: number;
    horizontalLineColor?: string;
    horizontalLineWidth?: number;
    verticalLineColor?: string;
    verticalLineWidth?: number;
    lineType?: TYPE;
    horizontalLineStrokeStyleDashSize?: number;
    verticalLineStrokeStyleDashSize?: number;
    toolTipLineColor?: string;
    toolTipLineWidth?: number;
    toolTipDotColor?: string;
    toolTipDotStrokeColor?: string;
    toolTipDotStrokeWidth?: number;
    toolTipDotRadius?: number;
    toolTipTouchXDistance?: number;
    toolTipTouchYDistance?: number;
    toolTipPosition?: POSITION;
    toolTipOpacityAnimationDuration?: number;
    toolTipMoveAnimationDuration?: number;
    xAxisLableInset?: boolean,
    clippedBorderBackground?: string;
    hideVerticalLines?: boolean;
    hideHorizontalLines?: boolean;
    xAxisLableEqualInset?: boolean;
    borderWidth?: number;
    borderColor?: string;
    minimumValue: number;
    maximumValue: number;
    formatYAxisLable?: (value: number) => string;
    formatToolTipYAxisLable?: (value: number) => string;
    xAxisLableWidth?: number;
    verticalLineDistance?: number;
    xAxisLables?: string[];
    disableAutoAdjustXAxisLablesOverFlow?: boolean;
    yAxisLableContainerStyle?: ViewStyle;
    yAxisLableTextStyle?: TextStyle;
    yAxisLableTextProps?: TextProps;
    xAxisLableContainerStyle?: ViewStyle;
    formatXAxisLable?: (label: string) => string;
    xAxisLableTextStyle?: TextStyle;
    xAxisLableTextProps?: TextProps;
    horizontalLineStrokeStyleDash?: NumberProp | NumberProp[];
    verticalLineStrokeStyleDash?: NumberProp | NumberProp[];
    hideClippedBorder?: boolean;
    disableToolTip?: boolean;
    hideToolTipHighlighterLine?: boolean;
    hideToolTipHighlighterDot?: boolean;
    toolTipXAxisLableTextProps?: ViewProps;
    toolTipXAxisLableTextStyle?: ViewStyle;
    formatToolTipXAxisLable?: (label: string) => string;
    hideToolTipYAxisLableBox?: boolean;
    toolTipYAxisLableBoxStyle?: ViewStyle;
    toolTipYAxisLableTextStyle?: TextStyle;
    toolTipYAxisLableTextProps?: TextProps;
    toolTipWidth?: number;
    toolTipHeight?: number;
    onLoadingSuccess: () => void;
    scrollEnabled?: boolean
}

export interface LineChartStates {
    viewHeight: number;
    viewWidth: number;
    viewX: number;
    viewY: number;
    toolTipIndex: number;
}