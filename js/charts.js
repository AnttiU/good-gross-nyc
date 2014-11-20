
var defaultCellFn= function( target, width, height, d, i ) {
    console.log( d )
    d3.select( target )
        .append( 'rect')
        .attr('width', width )
        .attr('height', height )
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill-opacity', 0)
        .attr('stroke', '#000')
}

var diagonalTextCellFn= function( target, cellWidth, cellHeight, d, i ) {
//    console.log( d )
    d3.select( target )
        .append( 'text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'end')
        .attr('transform', 'translate(' + cellWidth * 0.4 + ',' + 0 + ') rotate(-45)')
        .attr('dy', '1em')
        .text( d )
}

var renderGrid= function( target, columns, data, properties ) {
    properties= properties || {}
    var width= (properties['width'] || 500)
    var height= (properties['height'] || 400)
    var xSpacing= (properties['x-spacing'] || 3)
    var ySpacing= (properties['y-spacing'] || 3)
    var cellWidth= (width - (xSpacing * columns -xSpacing)) / columns
    var rows= data.length / columns
    var cellHeight= (height - (ySpacing * rows -xSpacing)) / rows
    var cellRenderFn= properties['cell-render-fn'] || defaultCellFn

    var grid= d3.select(target )
        .append('g' )
        .attr('class', 'grid')

    grid
        .selectAll(".cell")
        .data( data ).enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', function(d,i) {
            var x= (cellWidth + xSpacing) * (i % columns);
            var y= (cellHeight + ySpacing) * Math.floor(i / columns);
            return 'translate(' + x + ',' + y + ')' })
//        .attr('x', function(d,i) { return (cellWidth + xSpacing) * (i % columns)})
//        .attr('y', function(d,i) { return (cellHeight + ySpacing) * Math.floor(i / rows)})
        .each( function(d,i) { return cellRenderFn( this, cellWidth, cellHeight, d, i)} )


}

var render1DBarChart= function( target, properties ) {
    var width= (properties['width'] || 500)
    var height= (properties['height'] || 400)

    var chart= d3.select( target )
        .append('g')
        .attr('class', '1d bar chart')

    chart.append('rect')
        .attr('class', 'border')

    var clipPathId= 'clip-' + Math.round( Math.random() * 100000 );
    chart.append('clipPath')
        .attr('id', clipPathId )
//        .attr('clipPathUnits', 'objectBoundingBox')
        .append('rect')
        .attr('class', 'border')
        .attr('fill', "#666666")

    var refLines= chart.append('g')
        .attr('class', 'reference-lines')
//        .attr('clip-path', 'url(#' + clipPathId + ')' )
        .append('g')
        .attr('class', 'reference-lines-scaler')

//    d3.select(chart )
//        .select('.reference-line.num-' + i)
//        .attr('d', 'M ' + 0 + ' ' + referenceLineY + ' L ' + width + ' ' + referenceLineY + '')
//
//    d3.select(chart )
//        .selectAll('.reference-line-label.num-' + i)
//        .attr('x', 0)
//        .attr('y', referenceLineY)
//        .attr('dy', '0em')
//        .text( ( percentHeight * yExtent[1] ))

    var refLineYs= d3.range(0,2, 1)
    refLineYs.forEach( function( i ) {
        refLines.append('path')
            .attr('class', 'reference-line ' + 'num-' + i)
//            .attr('d', 'M ' + 0 + ' ' + (3000 - y) + ' L ' + 3000 + ' ' + (3000 - y) + '')

        refLines.append('text')
            .attr('class', 'reference-line-label '  + 'num-' + i)
//            .attr('x', 0)
//            .attr('y', (3000 - y))
//            .attr('dy', '0em')
//            .text( y )
    })

    chart.append('g')
        .attr('class', 'bars')

    chart.append('g')
        .attr('class', 'marker-labels')

    chart.append('path')
        .attr('class', 'bottom-line')
        .attr('d', 'M ' + -1 + ' ' + height + ' L ' + (width+1) + ' ' + height + '')

    return chart[0][0]
}

var update1DBarChart= function( chart, data, properties ) {
//    console.log( data )
    var width= (properties['width'] || 500)
    var height= (properties['height'] || 400)
    var unitSize= width / data.length;
    var valueFn= properties['value-fn'] || function(d) { return d }
    var yExtent= properties['y-extent'] || d3.extent( data.map( valueFn ) )
    var tickHeight= properties['tick-height'] || 100
    yExtent[0]= Math.min( yExtent[0], 0 )
    yExtent[1]= Math.max( 100, elih.math.ceilToNearest(100, yExtent[1] ))
    var fill= properties['fill'] || '#333'
    var markerClassFn= properties['marker-class-fn'] || function(d) { return "" }
    var onBarClickFn= properties['on-bar-click-fn'] || function(d) {}
    var barModifierFn= properties['bar-modifier-fn'] || function(d) {}
    var labelMarkerFn= properties['label-marker-fn']


//    var innerChartHeight= height /* for marker label */


    var scaleY= d3.scale.linear().domain( yExtent ).range( [0, height] )//.nice( 3 )
//    console.log( yExtent )
//    console.log( scaleY( yExtent[1] ) )
//    console.log( scaleY( data[data.length -1]))

    d3.select(chart ).selectAll('.border')
        .attr('width', width )
        .attr('height', height )
        .attr('x', 0)
        .attr('y', 0)

    //Draw reference lines
    var refLineYPercents= [.5, 1]
    refLineYPercents.forEach( function( percentHeight, i ) {
        var y= Math.round( percentHeight * Math.max( 0, yExtent[1] ) )
        var referenceLineY= (height- scaleY( y ))
        d3.select(chart )
            .select('.reference-line.num-' + i)
            .transition()
            .duration(100)
            .attr('opacity', 0)
            .transition()
            .duration(500)
            .attr('opacity', 1)
            .attr('d', 'M ' + 0 + ' ' + referenceLineY + ' L ' + width + ' ' + referenceLineY + '')

        d3.select(chart )
            .selectAll('.reference-line-label.num-' + i)
            .attr('x', 0)
            .attr('y', referenceLineY)
            .attr('dy', '0em')
            .transition()
            .duration(100)
            .attr('opacity', 0)
            .transition()
            .duration(500)
            .attr('opacity', 1)
            .text(y)

//        .tween("text", function(d) {
//                var i = d3.interpolate(this.textContent, y),
//                    prec = (d + "").split("."),
//                    round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
//
//                return function(t) {
//                    this.textContent = Math.round(i(t) * round) / round;
//                };
//            });

    })


    var bars= d3.select(chart ).select('.bars').selectAll( '.bar.marker')
        .data( data )

    bars.enter()
        .append('rect')

    bars.on("click", onBarClickFn);


    bars[0].forEach( function( element, i ) {
//        console.log( element )
//        console.log( markerClassFn( data[i], i ) )
        var newClass= markerClassFn( data[i], i ) + " bar marker";
//        console.log(  newClass.split(' ').filter( function(d) { return 0< d.length} ))
        if ( newClass ) {
            goog.dom.classlist.addAll( element, newClass.split(' ' ).filter( function(d) {return 0< d.length}) )
        }

//        console.log( data[i] )
        barModifierFn( element, data[i], i)

    })
//        .attr('class', function( d, i ) { return 'bar marker ' + markerClassFn( d, i ) })
    bars.transition()
        .duration(300)
        .attr('width', unitSize )
        .attr('height', function( d ) { return scaleY( valueFn( d ) )})
        .attr('x', function(d,i) { return i * unitSize })
        .attr('y', function( d ) { return height - scaleY( valueFn( d ) )} )
        .attr('fill', fill )

    var markerLabels= d3.select(chart ).select('.marker-labels').selectAll( '.label.marker')
        .data( data ).enter()
        .append('text')

    markerLabels
        .attr('text-anchor', 'middle')
        .attr('x', function(d,i) { return i * unitSize + 0.5 * unitSize })
        .attr('y', function( d ) { return height - scaleY( valueFn( d ) )} )
        .attr('dy', '-0.33em')
//            .attr('font-size', '12px')
        .text( labelMarkerFn )



}