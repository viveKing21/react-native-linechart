import { Animated, NativeScrollEvent, NativeSyntheticEvent, NativeTouchEvent, ScrollView, Text, View } from 'react-native'
import React, { PureComponent, createRef } from 'react'
import { Circle, Defs, G, Line, LinearGradient, Mask, Path,Rect,Stop, Svg } from 'react-native-svg'
import { TYPE, LineChartProps, LineChartStates, POSITION, Dataset } from './types'

type SvgLayoutType = {
    overAllWidth: number,
    overAllHeight: number,
    viewWidth: number,
    viewHeight: number,
    viewX: number,
    viewY: number,
    rowCount: number,
    colCount: number,
    cellHeight: number,
    cellWidth: number,
}

export default class LineChart extends PureComponent<LineChartProps, LineChartStates> {
    static defaultProps: Partial<LineChartProps> = {
        horizontalLineCount: 5,
        svgPaddingLeft: 3,
        svgPaddingRight: 3,
        svgPaddingTop: 3,
        svgPaddingBottom: 3,
        horizontalLineColor: "black",
        horizontalLineWidth: 1,
        verticalLineColor: "black",
        verticalLineWidth: 1,
        lineType: TYPE.CUBIC_BEZIER,
        lineColor: 'black',
        lineWidth: 2,
        horizontalLineStrokeStyleDashSize: 10,
        verticalLineStrokeStyleDashSize: 10,
        dotColor: 'red',
        dotRadius: 3,
        areaOpacity: 1,
        areaGradients: [
            {offset: 0, color: 'grey', opacity: 1},
            {offset: 100, color: 'lightgrey', opacity: .6}
        ],
        toolTipLineColor: "black",
        toolTipLineWidth: 1,
        toolTipDotColor: "black",
        toolTipDotStrokeColor: "white",
        toolTipDotStrokeWidth: 1,
        toolTipDotRadius: 3,
        toolTipTouchXDistance: 10,
        toolTipTouchYDistance: 10,
        toolTipPosition: POSITION.TOP_LEFT,
        toolTipOpacityAnimationDuration: 100,
        toolTipMoveAnimationDuration: 100,
        xAxisLableInset: true,
        clippedBorderBackground: 'white',
    }

    xAxisScrollViewRef = createRef<ScrollView>()
    scrollViewRef = createRef<ScrollView>()
    toolTipRef = createRef<View>()

    toolTipPositionAnimation = new Animated.ValueXY({x: 0, y: 0})
    toolTipOpacityAnimation = new Animated.Value(0)

    toolTipIndexPrev = 0

    constructor(props: LineChartProps) {
        super(props)

        this.state = {
            viewHeight: props.height,
            viewWidth: props.width,
            viewX: 0,
            viewY: 0,
            toolTipIndex: 0
        }
    }
    componentDidUpdate(prevPops: Readonly<LineChartProps>) {
        if(prevPops.datasets != this.props.datasets) {
            this.setState({toolTipIndex: 0})
            this.toolTipOpacityAnimation.setValue(0)
            this.toolTipPositionAnimation.setValue({x: 0, y: 0})
            this.scrollViewRef.current?.scrollTo({x: 0, animated: false})
        }
    }
    getProperty(key: keyof LineChartProps): any {
        switch(key){
            case 'verticalLineWidth':
                if(this.props.hideVerticalLines) return 0
                break
            case 'horizontalLineWidth':
                if(this.props.hideHorizontalLines) return 0
                break
            case 'xAxisLableInset':
                if('xAxisLables' in this.props == false) return false
                break
            case 'xAxisLableEqualInset':
                if(this.getProperty('xAxisLableInset') == false) return false
                break
            case 'borderWidth':
                if('borderWidth' in this.props == false) return this.getProperty('verticalLineWidth')
                break
            case 'borderColor':
                if('borderColor' in this.props == false) return this.getProperty('verticalLineColor')
        }

        if (key in this.props) return this.props[key]
        return LineChart.defaultProps[key]
    }
    getProperties(...keys: (keyof LineChartProps)[]) {
        return keys.map(this.getProperty.bind(this))
    }
    getDataSetProperty() {
        let dataset = this.props.datasets

        return {
            maxLength() {
                return dataset.reduce((acc, {values}) => Math.max(acc, values.length), -Infinity)
            }
        }
    }
    getPath(data: number[], svgLayout: SvgLayoutType){
        let path = ''

        let moveX = 0
        let moveY = 0
        let previousX = 0
        let previousY = 0

        let type = this.getProperty("lineType")
        let inset = this.getProperty('xAxisLableInset')
        let verticalLineWidth = this.getProperty("verticalLineWidth")
        let horizontalLineWidth = this.getProperty("horizontalLineWidth")
        let halfVerticalLineWidth = verticalLineWidth / 2
        let halfHorizontalLineWidth = horizontalLineWidth / 2

        let { viewX, viewY, viewHeight, cellWidth } = this.getSvgLayout()

        if(inset){
            moveX = viewX + halfVerticalLineWidth
            moveY = viewY + viewHeight + halfHorizontalLineWidth
            previousX = moveX
            previousY = moveY
        }

        for(let index = 0; index < data.length; index++){
            let value = Math.max(this.props.minimumValue, Math.min(this.props.maximumValue, data[index]))
            let {x, y} = this.getCoords(value, index)

            if(index == 0){
                x -= halfVerticalLineWidth
            }
            if(index == data.length-1){
                x += halfVerticalLineWidth
            }

            if(index == 0 && !inset){
                moveX = x
                moveY = y
            }else{
                if(type == TYPE.LINE) path += `L${x} ${y} `
                else if(type == TYPE.QUADRATIC_BEZIER) path += `Q${(previousX + x) / 2} ${y}, ${x} ${y} `
                else if(type == TYPE.CUBIC_BEZIER) path += `C${(previousX + x) / 2} ${previousY}, ${(previousX + x) / 2} ${y}, ${x} ${y} `
            }

            previousX = x
            previousY = y
        }

        if(inset){
            let xAxisLableLeft = this.getProperty('xAxisLableInset') ? ((this.props.xAxisLableWidth || cellWidth) / 2):0
            if(this.getProperty('xAxisLableEqualInset')) xAxisLableLeft = cellWidth
            
            let x = previousX + xAxisLableLeft - halfVerticalLineWidth
            let y = moveY - halfHorizontalLineWidth
            if(type == TYPE.LINE) path += `L${x} ${y} `
            else if(type == TYPE.QUADRATIC_BEZIER) path += `Q${(previousX + x) / 2} ${y}, ${x} ${y} `
            else if(type == TYPE.CUBIC_BEZIER) path += `C${(previousX + x) / 2} ${previousY}, ${(previousX + x) / 2} ${y}, ${x} ${y} `
        }

        return {
            strokePath(){
                return `M${moveX} ${moveY} ${path}`
            },
            fillingPath(){
                return `M${moveX} ${viewHeight+viewY+halfHorizontalLineWidth} L${moveX} ${moveY} ${path} L${previousX} ${svgLayout.viewHeight + svgLayout.viewY + halfHorizontalLineWidth} Z`
            }
        }
    }
    getSvgLayout(): SvgLayoutType {
        let { viewHeight: height, viewWidth: width, viewX: svgX } = this.state
        let [hlc, vld, spl, spr, spt, spb, xali] = this.getProperties(
                                            "horizontalLineCount",
                                            "verticalLineDistance",
                                            "svgPaddingLeft", 
                                            "svgPaddingRight", 
                                            "svgPaddingTop", 
                                            "svgPaddingBottom",
                                            "xAxisLableInset"
                                        )
        
        let maxLength = this.getDataSetProperty().maxLength()

        let verticalLineWidth = this.getProperty("verticalLineWidth")
        let horizontalLineWidth = this.getProperty("horizontalLineWidth")
        
        let viewHeight = height - (spt + spb) - horizontalLineWidth
        let viewWidth = Math.max(width, (vld || 0) * maxLength) - (spl + spr) - verticalLineWidth

        let viewX = spl + verticalLineWidth / 2
        let viewY = spt + horizontalLineWidth / 2

        let rowCount = hlc - 1
        let colCount = maxLength - 1
        let cellHeight = viewHeight / rowCount
        let cellWidth = viewWidth / colCount

        if(this.props.xAxisLables){
            let xAxisLableWidth = this.props.xAxisLableWidth || cellWidth

            if(xali){
                if(this.getProperty('xAxisLableEqualInset')) cellWidth = viewWidth / (colCount + 2)
                else cellWidth = (viewWidth - xAxisLableWidth) / colCount
            }
            else {
                if(!this.props.disableAutoAdjustXAxisLablesOverFlow){
                    // fix xAxis lable overflow to left direction
                    let minLeft = Math.max(0, xAxisLableWidth / 2 - svgX)
                    viewX += minLeft
                    viewWidth -= minLeft
                    spl += minLeft
                }
                // recalculating view and cellwidth based on the xAxisLableWidth
                viewWidth -= xAxisLableWidth / 2
                cellWidth = viewWidth / colCount
            }
        }

        let overAllHeight = Math.round(viewHeight + spt + spb + horizontalLineWidth)
        let overAllWidth = Math.round(viewWidth + spl + spr + verticalLineWidth)

        return {
            overAllWidth,
            overAllHeight,
            viewWidth,
            viewHeight,
            viewX,
            viewY,
            rowCount,
            colCount,
            cellHeight,
            cellWidth
        }
    }
    getCoords(value: number, index: number) {
        let { minimumValue, maximumValue } = this.props

        let { viewHeight, viewX, viewY, cellWidth } = this.getSvgLayout()

        let xAxisLableLeft = this.getProperty('xAxisLableInset') ? ((this.props.xAxisLableWidth || cellWidth) / 2):0
        if(this.getProperty('xAxisLableEqualInset')) xAxisLableLeft = cellWidth

        let x = xAxisLableLeft + (index * cellWidth + viewX)
        let y = viewHeight - (value - minimumValue) / (maximumValue - minimumValue) * viewHeight + viewY

        return {
            x,
            y
        }
    }
    renderYAxisLables() {
        let { minimumValue, maximumValue, formatYAxisLable } = this.props

        let { viewHeight, viewY, rowCount, cellHeight } = this.getSvgLayout()

        return (
            <View style={[{ height: viewHeight, transform: [{translateY: viewY}] }, this.props.yAxisLableContainerStyle]}>
                {
                    Array.from({ length: rowCount + 1 }, (_, index) => {
                        let lable = (maximumValue - minimumValue) / rowCount * (rowCount - index) + minimumValue
                        let lableText = formatYAxisLable ? formatYAxisLable(lable) : lable.toFixed(2)
                        return (
                            <View key={index} style={{ height: cellHeight }}>
                                <Text 
                                style={[
                                    {
                                        transform: [{ translateY: -10 }],
                                        textAlignVertical: 'center',
                                        fontSize: 10,
                                        color: 'black',
                                        height: 20,
                                        textAlign: 'right'
                                    },
                                    this.props.yAxisLableTextStyle
                                ]}
                                adjustsFontSizeToFit
                                {...this.props.yAxisLableTextProps}
                                >
                                    {lableText}
                                </Text>
                            </View>
                        )
                    })
                }
            </View>
        )
    }
    renderXAxisLables(){
        if(!this.props.xAxisLables) return null

        let { viewX: svgLeft } = this.state
        let { cellWidth, viewX } = this.getSvgLayout()
        let { xAxisLables } = this.props

        let inset = this.getProperty('xAxisLableInset')
        let equalInset = this.getProperty('xAxisLableEqualInset')
        let xAxisLableWidth = (this.props.xAxisLables && this.props.xAxisLableWidth) || cellWidth

        return (
            <View>
                <ScrollView
                    ref={this.xAxisScrollViewRef}
                    style={[
                        {
                            marginLeft: svgLeft + viewX - (inset ? 0:xAxisLableWidth / 2),
                        },
                        this.props.xAxisLableContainerStyle
                    ]}
                    contentContainerStyle={{flexGrow: 1}}
                    overScrollMode='never'
                    horizontal
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                >
                    {
                        xAxisLables.map((lable, index) => {
                            let lableText = this.props.formatXAxisLable ? this.props.formatXAxisLable(lable):lable
                            let marginLeft = 0, marginRight = 0

                            if(index == 0) marginLeft = equalInset ? cellWidth:xAxisLableWidth / 2
                            else marginLeft = cellWidth - xAxisLableWidth

                            if(index == xAxisLables.length-1){
                                marginRight = cellWidth - xAxisLableWidth
                            }

                            return (
                                <Text key={index}
                                    style={[
                                        {
                                            width: xAxisLableWidth,
                                            maxWidth: xAxisLableWidth,
                                            textAlign: 'center',
                                            fontSize: 10,
                                            color: 'black',
                                            marginLeft,
                                            marginRight,
                                            transform: [{translateX: -(xAxisLableWidth / 2)}]
                                        },
                                        this.props.xAxisLableTextStyle
                                    ]}
                                    {...this.props.xAxisLableTextProps}
                                >
                                    {lableText}
                                </Text>
                            )
                        })
                    }
                </ScrollView>
            </View>
        )
    }
    renderLines(){
        let { viewWidth, viewHeight, rowCount, colCount, cellHeight, cellWidth, viewX, viewY } = this.getSvgLayout()
        
        let [hvl, hhl, hlc, hlw, vlc, vlw, hlssd, hlssds, vlssd, vlssds, xali, xalei] = this.getProperties(
            "hideVerticalLines",
            "hideHorizontalLines",
            "horizontalLineColor",
            "horizontalLineWidth",
            "verticalLineColor",
            "verticalLineWidth",
            "horizontalLineStrokeStyleDash",
            "horizontalLineStrokeStyleDashSize",
            "verticalLineStrokeStyleDash",
            "verticalLineStrokeStyleDashSize",
            "xAxisLableInset",
            "xAxisLableEqualInset"
        )

        let xAxisLableLeft = xali ? ((this.props.xAxisLableWidth || cellWidth) / 2):0
        if(xalei) xAxisLableLeft = cellWidth

        return (
            <G mask={"url(#masking)"}>
                {
                    hhl ? null:Array.from({length: rowCount + 1}, (_, index) => {
                        return (
                            <Line
                                key={index}
                                x1={viewX}
                                x2={viewX + viewWidth}
                                y={cellHeight * index + viewY}
                                stroke={hlc}
                                strokeWidth={hlw}
                                strokeDasharray={hlssd && hlssds}
                            />
                        )
                    })
                }
                {
                    hvl ? null:(
                        Array.from({length: colCount + 1}, (_, index) => {
                            return (
                                <Line
                                    key={index}
                                    x={xAxisLableLeft + (cellWidth * index + viewX)}
                                    y1={viewY - (vlw / 2)}
                                    y2={viewY + viewHeight + (vlw / 2)}
                                    stroke={vlc}
                                    strokeWidth={vlw}
                                    strokeDasharray={vlssd && vlssds}
                                />
                            )
                        })
                    )
                }
            </G>
        )
    }
    renderClippedBorder(){
        if(this.props.hideClippedBorder) return null

        let {viewX: x, viewY: y, viewWidth: width, viewHeight: height} = this.state
        let { viewX, viewHeight, viewY } = this.getSvgLayout()
        
        let [vlw, hlw, bw, bc, vlc, cbb] = this.getProperties(
            "verticalLineWidth",
            "horizontalLineWidth",
            "borderWidth",
            "borderColor",
            "verticalLineColor",
            "clippedBorderBackground"
        )

        let translateY = y + viewY - hlw / 2

        return (
            <>
                <View style={{
                    height: viewHeight + hlw,
                    width: viewX,
                    position: 'absolute',
                    backgroundColor: cbb,
                    borderRightWidth: bw || vlw,
                    borderColor: bc || vlc,
                    transform: [
                        {translateX: x},
                        {translateY}
                    ]
                }} />
                <View style={{
                    height: viewHeight + hlw,
                    width: viewX,
                    position: 'absolute',
                    backgroundColor: cbb,
                    borderLeftWidth: bw,
                    borderColor: bc,
                    transform: [
                        {translateX: x + width - viewX},
                        {translateY}
                    ]
                }} />
            </>
        )
    }
    renderDots(data: Dataset){
        if(data.hideDot ?? this.getProperty("hideDot")) return null

        return (
            <G>
                {
                    data.values.map((value, index) => {
                        let fill = data.dotColor ?? this.getProperty("dotColor")
                        let opacity = data.dotOpacity ?? this.getProperty("dotOpacity")
                        let radius = data.dotRadius ?? this.getProperty("dotRadius")
                        let stroke = data.dotStrokeColor ?? this.getProperty("dotStrokeColor")
                        let strokeWidth = data.dotStrokeWidth ?? this.getProperty("dotStrokeWidth")

                        let { x, y } = this.getCoords(value, index)

                        return (
                            <Circle
                                key={index}
                                cx={x}
                                cy={y}
                                r={radius}
                                fill={fill}
                                opacity={opacity}
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                            />
                        )
                    })
                }
            </G>
        )
    }
    renderPathsWidthDots(){
        let dataset = this.props.datasets
        let svgLayout = this.getSvgLayout()
        let paths = dataset.map(({values}) => this.getPath(values, svgLayout))

        let verticalLineWidth = this.getProperty("verticalLineWidth")
        let horizontalLineWidth = this.getProperty("horizontalLineWidth")

        return (
            <>
                <Defs>
                    {
                        <Mask id={`masking`}>
                            <Rect 
                                x={svgLayout.viewX - verticalLineWidth / 2} 
                                y={svgLayout.viewY - horizontalLineWidth / 2} 
                                width={svgLayout.viewWidth + verticalLineWidth} 
                                height={svgLayout.viewHeight + horizontalLineWidth} 
                                fill={'white'}
                            />
                            {
                                paths.map((path, index) => {
                                    let data = dataset[index]
                                    let disableArea = data.disableArea ?? this.getProperty("disableArea")
                                    let disableMasking = data.disableMasking ?? this.getProperty("disableMasking") ?? disableArea

                                    if(disableMasking) return null
                                    return (
                                        <Path key={index} d={path.fillingPath()} fill='black'/>
                                    )
                                })
                            }
                        </Mask>
                    }
                    {
                        paths.map((path, index) => {
                            let data = dataset[index]
                            let areaGredient = data.areaGradients ?? this.getProperty("areaGradients")
                            let areaColor = data.areaColor ?? this.getProperty("areaColor")
                            let disableArea = data.disableArea ?? this.getProperty("disableArea")

                            return (
                                <React.Fragment key={index}>
                                    {
                                        disableArea || areaColor ? null:(
                                            <LinearGradient id={`gredient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%" key={index}>
                                                {
                                                    areaGredient.map(({offset = 100, color = 'grey', opacity = 1}, index: number) => {
                                                        return <Stop key={'stop-'+index} offset={offset + '%'} stopColor={color} stopOpacity={opacity}/>
                                                    })
                                                }
                                            </LinearGradient>
                                        )
                                    }
                                </React.Fragment>
                            )
                        })
                    }
                </Defs>
                <G>
                    {
                        paths.map((path, index) => {
                            let data = dataset[index]
                            let areaColor = data.areaColor ?? this.getProperty("areaColor")
                            let areaOpacity = data.areaOpacity ?? this.getProperty("areaOpacity")
                            let disableArea = data.disableArea ?? this.getProperty("disableArea")
                            let lineColor = data.lineColor ?? this.getProperty("lineColor")
                            let lineWidth = data.lineWidth ?? this.getProperty("lineWidth")
                            let hideLine = data.hideLine ?? this.getProperty("hideLine")

                            return (
                                <G key={index}>
                                    {
                                        disableArea ? null:(
                                            <Path
                                                d={path.fillingPath()}
                                                fill={areaColor || `url(#gredient-${index})`}
                                                opacity={areaOpacity}
                                            />
                                        )
                                    }
                                    {
                                        hideLine ? null:(
                                            <Path 
                                                d={path.strokePath()}
                                                stroke={lineColor}
                                                strokeWidth={lineWidth}
                                                fill='none'
                                            />
                                        )
                                    }
                                    {this.renderDots(dataset[index])}
                                </G>
                            )
                        })
                    }
                </G>
            </>
        )
    }
    renderToolTip(){
        if(this.props.disableToolTip) return

        let { viewX, viewY, viewHeight, cellWidth } = this.getSvgLayout()
        let { toolTipIndex } = this.state

        let [
            toolTipLineWidth,
            toolTipLineColor,
            toolTipDotColor,
            toolTipDotStrokeColor,
            toolTipDotStrokeWidth,
            toolTipDotRadius,
            xAxisLableInset
        ] = this.getProperties(
            'toolTipLineWidth',
            'toolTipLineColor',
            'toolTipDotColor', 
            'toolTipDotStrokeColor', 
            'toolTipDotStrokeWidth', 
            'toolTipDotRadius',
            'xAxisLableInset')

        let xAxisLableLeft = xAxisLableInset ? ((this.props.xAxisLableWidth || cellWidth) / 2):0
        if(this.getProperty('xAxisLableEqualInset')) xAxisLableLeft = cellWidth
        let xAxisLable = this.props.xAxisLables && this.props.xAxisLables[toolTipIndex]

        return (
            <>
            <Animated.View
                style={{
                    position: 'absolute',
                    top: viewY,
                    left: xAxisLableLeft + (viewX + cellWidth * toolTipIndex),
                    height: viewHeight,
                    pointerEvents: 'none',
                    opacity: this.toolTipOpacityAnimation
                }}
            >
                {
                    this.props.hideToolTipHighlighterLine ? null:(
                        <View 
                            style={{
                                height: "100%", 
                                width: toolTipLineWidth, 
                                backgroundColor: toolTipLineColor,
                                position: 'absolute',
                                transform: [{translateX: -toolTipLineWidth / 2}]
                            }}  
                        />
                    )
                }
                
                {
                    this.props.hideToolTipHighlighterDot ? null:this.props.datasets.map(({values}, index) => {
                        if(values[toolTipIndex] == undefined) return null
                        let { y } = this.getCoords(values[toolTipIndex], index)
                        let radius = toolTipDotRadius * 2 + toolTipDotStrokeWidth * 2

                        return (
                            <View 
                                key={index}
                                style={{
                                    height: radius,
                                    width: radius,
                                    borderRadius: radius,
                                    backgroundColor: toolTipDotColor,
                                    position: 'absolute',
                                    transform: [{translateX: radius / 2 * -1}, {translateY: y - (radius / 2) - viewY}],
                                    borderWidth: toolTipDotStrokeWidth,
                                    borderColor: toolTipDotStrokeColor,
                                }} 
                            />
                        )
                    })
                }
            </Animated.View>
            <Animated.View
                ref={this.toolTipRef}
                style={[
                    {
                        position: 'absolute',
                        backgroundColor: "white",
                        elevation: 2,
                        shadowOffset: {width: 0, height: 0},
                        shadowColor: 'black',
                        shadowRadius: 3,
                        shadowOpacity: .2,
                        justifyContent: 'center',
                        top: viewY,
                        left: xAxisLableLeft + viewX ,
                        borderRadius: 3,
                        transform: [{translateX: this.toolTipPositionAnimation.x}, {translateY: this.toolTipPositionAnimation.y}],
                        pointerEvents: 'none',
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        opacity: this.toolTipOpacityAnimation
                    }
                ]}
            >
                {
                    xAxisLable && (
                        <View>
                            <Text
                                style={[{fontSize: 10, marginBottom: 3, fontWeight: 'bold', color: 'black', textAlign: 'center'}, this.props.toolTipXAxisLableTextStyle]}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                                {...this.props.toolTipXAxisLableTextProps}
                            >
                                {this.props.formatToolTipXAxisLable ? this.props.formatToolTipXAxisLable(xAxisLable):xAxisLable}
                            </Text>
                        </View>
                    )
                }
                {
                    this.props.datasets.map((data, index) => {
                        let lable = data.values[toolTipIndex]

                        let gredient = data.areaGradients ?? this.getProperty("areaGradients")
                        let fill = data.areaFill ?? data.dotColor ?? data.lineColor ?? this.getProperty("areaFill")

                        let toolTipYAxisLableBoxColor = fill || gredient[0].color
                        return (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}} key={index}>
                                {
                                    this.props.hideToolTipYAxisLableBox ? null:(
                                        <View style={[{height: 5, width: 10, backgroundColor: toolTipYAxisLableBoxColor, borderRadius: 3}, this.props.toolTipYAxisLableBoxStyle]} />
                                    )
                                }
                                <Text
                                    style={[{fontSize: 10, color: 'black'}, this.props.toolTipYAxisLableTextStyle]}
                                    adjustsFontSizeToFit
                                    numberOfLines={1}
                                    {...this.props.toolTipYAxisLableTextProps}
                                >
                                    {this.props.formatToolTipYAxisLable ? this.props.formatToolTipYAxisLable(lable):lable}
                                </Text>
                            </View>
                            
                        )
                    })
                }
            </Animated.View>
            </>
        )
    }
    handleScroll({nativeEvent}: {nativeEvent: NativeScrollEvent}) {
        let x = nativeEvent.contentOffset.x
        if(this.xAxisScrollViewRef && this.xAxisScrollViewRef.current){
            this.xAxisScrollViewRef.current.scrollTo({x, animated: false})
        }
    }
    async handleTouchStart(event: NativeSyntheticEvent<NativeTouchEvent>) {
      if(this.props.disableToolTip) return
       await this.handleTouchMove(event)

        Animated.timing(this.toolTipOpacityAnimation, {
            toValue: 1,
            duration: this.getProperty("toolTipOpacityAnimationDuration"),
            useNativeDriver: true
        }).start()
    }
    async handleTouchMove({nativeEvent}: {nativeEvent: NativeTouchEvent}){
        if(this.props.disableToolTip) return
        let { cellWidth, viewHeight, viewWidth } = this.getSvgLayout()

        let { locationX } = nativeEvent

        if(this.getProperty('xAxisLableInset')){
            let xAxisLableLeft = (this.props.xAxisLableWidth || cellWidth) / 2
            if(this.getProperty('xAxisLableEqualInset')) xAxisLableLeft = cellWidth
            locationX = locationX - xAxisLableLeft
        }

        let maxLength = this.getDataSetProperty().maxLength()
        let index = Math.max(0, Math.min(maxLength-1, Math.round(locationX / cellWidth)))

        this.setState(prev => ({...prev, toolTipIndex: index}))

        if(this.toolTipIndexPrev == index) return
        
        let [toolTipWidth, 
            toolTipHeight,
            toolTipTouchXDistance, 
            toolTipTouchYDistance, 
            toolTipPosition] = this.getProperties(
            "toolTipWidth", 
            "toolTipHeight",
            "toolTipTouchXDistance", 
            "toolTipTouchYDistance", 
            "toolTipPosition") 


        if(!toolTipWidth || !toolTipHeight){
            let results = await new Promise<{toolTipWidth: number, toolTipHeight: number}>((res, rej) => {
                this.toolTipRef.current?.measure((x, y, w, h) => res({toolTipWidth: w, toolTipHeight: h}))
            })
            toolTipWidth = results.toolTipWidth
            toolTipHeight = results.toolTipHeight
        }

        let posX = cellWidth * index
        let posY = nativeEvent.locationY

        let x = posX
        let y = posY

        if(toolTipPosition == "top-left"){
            x -= toolTipWidth + toolTipTouchXDistance
            y -= toolTipHeight + toolTipTouchYDistance
        }else if(toolTipPosition == "bottom-left"){
            x -= toolTipWidth + toolTipTouchXDistance
            y += toolTipTouchYDistance
        }else if(toolTipPosition == "top-right"){
            x += toolTipTouchXDistance
            y -= toolTipHeight + toolTipTouchYDistance
        }else if(toolTipPosition == "bottom-right"){
            x += toolTipTouchXDistance
            y += toolTipTouchYDistance
        }

        let isOutFromTop = y < toolTipTouchYDistance
        let isOutFromLeft = x < toolTipTouchXDistance
        let isOutFromBottom = y > viewHeight - toolTipHeight - toolTipTouchYDistance
        let isOutFromRight = x > viewWidth - toolTipWidth - toolTipTouchXDistance

        if(isOutFromTop) y = toolTipTouchYDistance
        if(isOutFromLeft) x = posX + toolTipTouchXDistance
        if(isOutFromBottom) y = viewHeight - toolTipHeight - toolTipTouchYDistance
        if(isOutFromRight) x = posX - toolTipWidth - toolTipTouchXDistance

        Animated.timing(this.toolTipPositionAnimation, {
            toValue: {x, y},
            duration: this.getProperty("toolTipMoveAnimationDuration"),
            useNativeDriver: true
        }).start()
        
        this.toolTipIndexPrev = index
    }
    handleTouchEnd(event: NativeSyntheticEvent<NativeTouchEvent | NativeScrollEvent>){
        if(this.props.disableToolTip) return
        Animated.timing(this.toolTipOpacityAnimation, {
            toValue: 0,
            duration: this.getProperty("toolTipOpacityAnimationDuration"),
            useNativeDriver: true
        }).start()
    }
    render() {
        let { height, width } = this.props
        let { viewWidth } = this.state
        let { overAllWidth, overAllHeight, cellWidth } = this.getSvgLayout()

        let inset = this.getProperty('xAxisLableInset')
        let halfXAxisLableWidth = (this.props.xAxisLableWidth || cellWidth) / 2
        let paddingRight = inset ? 0:'xAxisLables' in this.props  ? halfXAxisLableWidth:0

        let isLayoutScrollable = Math.round(viewWidth - paddingRight) != overAllWidth
        let scrollEnabled = 'scrollEnabled' in this.props ? this.props.scrollEnabled : isLayoutScrollable

        return (
            <View style={[{ height, width }]} >
                <View style={{ flexDirection: 'row', flex: 1, position: 'relative' }}>
                    {this.renderYAxisLables()}
                    <ScrollView
                        ref={this.scrollViewRef}
                        style={{ flex: 1 }}
                        contentContainerStyle={{flexGrow: 1, paddingRight}}
                        onLayout={({ nativeEvent }) => {
                            let { height, width, x, y } = nativeEvent.layout
                            this.setState(prev => ({
                                ...prev,
                                viewHeight: height,
                                viewWidth: width,
                                viewX: x,
                                viewY: y
                            }))
                            if('onLoadingSuccess' in this.props){
                                this.props.onLoadingSuccess()
                            }
                        }}
                        horizontal
                        scrollEnabled={scrollEnabled}
                        showsHorizontalScrollIndicator={false}
                        onScroll={this.handleScroll.bind(this)}
                        scrollEventThrottle={16}
                        onTouchStart={this.handleTouchStart.bind(this)}
                        onTouchMove={this.handleTouchMove.bind(this)}
                        onTouchCancel={this.handleTouchEnd.bind(this)}
                        onTouchEnd={this.handleTouchEnd.bind(this)}
                        onMomentumScrollEnd={this.handleTouchEnd.bind(this)}
                        onTouchEndCapture={() => true}
                        overScrollMode='never'
                        bounces={false}
                    >
                        <Svg
                            height={overAllHeight}
                            width={overAllWidth}
                            viewBox={`0 0 ${overAllWidth} ${overAllHeight}`}
                        >
                            {this.renderLines()}
                            {this.renderPathsWidthDots()}
                        </Svg>
                        {this.renderToolTip()}
                    </ScrollView>
                    {this.renderClippedBorder()}
                </View>
                {this.renderXAxisLables()}
            </View>
        )
    }
}

