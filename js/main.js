/**
 * Parse / sanitize raw data
 * @param data
 * @returns {*}
 */
var sanitizeData= function(data) {
    data.forEach( function ( d ) {
        d['yelp_rating_count'] = parseFloat( d['yelp_rating_count'] ) || null
        d['yelp_rating'] = parseFloat( d['yelp_rating'] ) || null
        d['yelp_price'] = parseFloat( d['yelp_price'] ) || null
        d['seamless_rating'] = parseFloat( d['seamless_rating'] ) || null
        d['seamless_rating_count'] = parseFloat( d['seamless_rating_count'] ) || null
        d['seamless_price'] = parseFloat( d['seamless_price'] ) || null
        d['sanitation_grade'] = d['sanitation_grade'] || null
        //Make sure 0's aren't interpreted as nulls
        d['sanitation_score'] = ( d['sanitation_score'] != null )? parseFloat( d['sanitation_score'] ) : null
        d['median_zip_income'] = parseFloat( d['median_zip_income'] ) || null

    } )
    return data;
}




//////////////////////////////////////////////////////////////////////////////
//Misc helper functions
///////////////////////////////////////

var formatLine1= d3.format(",d")
var formatPercent= d3.format("%")

var isMobile= function() {
    return goog.dom.getViewportSize().width < 768;
}

var createVizResizeFn= function( vizContainer, svgElements ) {
    return function() {
        svgElements.forEach( function( curSvg ) {
            var targetWidth= goog.style.getSize( vizContainer ).width;
            var aspect= curSvg.getAttribute( 'width' ) / ( curSvg.getAttribute( 'height' ) || 1);
            viz.setAttribute( 'width', targetWidth );
            viz.setAttribute( 'height', Math.round( targetWidth / aspect ) );

            //Set the bounds with CSS as well to overcome chrome CSS bug
            goog.style.setSize( curSvg, targetWidth, Math.round( targetWidth / aspect ) );
        })

    }
};


//////////////////////////////////////////////////////////////////////////////
//Tooltip functions
///////////////////////////////////////

var defaultGetTooltipText= function( curData, curFilter ) {
    var validData= curData.filter( function(d) { return curFilter( d.key )})

    var validKeys= validData.reduce( function(l,r) {  l.push( r.key); return l; }, [])

    var validRestaurantCount= validData.reduce( function(l,r) {  return l + r.value; }, 0)

    var visibleRestaurantCount= curData.reduce( function(l,r) {  return l + r.value; }, 0)

    var extent= d3.extent( validKeys )
    var filterDescription= "from " + ( extent[0] ).toFixed( 1 ) + ' - ' + ( extent[1]).toFixed( 1 )

    return [formatLine1( validRestaurantCount ), " (" + formatPercent( validRestaurantCount / visibleRestaurantCount ) + ")", "restaurants", filterDescription];
}

var renderTooltip= function( target ) {

    var chartTooltip= d3.select( target )
        .append('g')
        .attr("class", "brush-tooltip")

    chartTooltip.append('polygon')
        .attr('points', "0,0 108,0 108,72.5 61.7,72.5 54,87 46.3,72.5 0,72.5 ")
    var tooltipWidth= chartTooltip[0][0].getBBox().width
    var tooltipHeight= chartTooltip[0][0].getBBox().height

    var chartTooltipText= chartTooltip.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', '0.5em')


    chartTooltipText.append('tspan')
        .attr('dy', '1em' )
        .attr('x', tooltipWidth * 0.5 )

    chartTooltipText.append('tspan')

    chartTooltipText.append('tspan')
        .attr('dy', '1em' )
        .attr('x', tooltipWidth * 0.5 )

    chartTooltipText.append('tspan')
        .attr('dy', '1em' )
        .attr('x', tooltipWidth * 0.5 )

    hideTooltip( chartTooltip[0][0] )

    return chartTooltip[0][0]
}

var updateTooltip= function( curChart, curTooltip, curData, curFilter, toolTipTextFn ) {

    var target= d3.select( curChart ).select( '.tooltip-target' )[0][0];
    var tooltip= curTooltip
    var textLines= toolTipTextFn(  curData, curFilter )

    if ( null == target || null == tooltip ) {
        d3.select( tooltip ).attr('transform', 'translate(' + -999999999 + ','+ -999999999 + ')' )
        return;
    };
    var targetBBox= target.getBBox()
    var extentWidth= targetBBox.width
    var extentElementX= targetBBox.x
    var extentElementY= targetBBox.y
    var tooltipBBox= tooltip.getBBox()

    var tooltipX= (extentElementX - (tooltipBBox.width * 0.5 ) + (0.5 * extentWidth ));
    var tooltipY= extentElementY - (tooltipBBox.height - 3);
    tooltip= d3.select( tooltip )
    tooltip.attr('transform', 'translate(' + tooltipX + ','+ tooltipY + ')' )


    tooltip.selectAll('tspan' ).data(textLines).text(  function(d) { return d} )

}

var showTooltip= function( tooltip ) {
    goog.dom.classlist.remove(tooltip, 'hidden')
}

var hideTooltip= function( tooltip ) {
    goog.dom.classlist.add(tooltip, 'hidden')
}

var attachTooltip= function( target ) {
    goog.dom.classlist.add( target, 'tooltip-target')
}

var detachTooltip= function( target ) {
    d3.select( target )
    .selectAll( '.tooltip-target')
        .call( function() {
            if ( this[0][0] != null ) {
                goog.dom.classlist.remove( this[0][0], 'tooltip-target')
            }})
}


//////////////////////////////////////////////////////////////////////////////
//Main function to run
///////////////////////////////////////

var main= function( target, data ) {



    ////////////////////////////////////////////////////
    // Setup / Initialize Data & Dimensions
    //////////////////////////


//Which fields to use
    var fields= ['yelp_rating',
        'yelp_price', 'yelp_rating_count',
        'seamless_rating',
        'seamless_price', 'seamless_rating_count',
        'sanitation_score',
        'median_zip_income',
        'category',
        'city'
    ]


    var categories= keys_( goodgross.categories )
    var categoryDisplayNames= vals_( goodgross.categories )
    var cities= keys_( goodgross.boroughs)
    var cityDisplayNames= vals_( goodgross.boroughs)


////////////////////////////////////////////////////
//Setup functions that define each dimension
//////////////////////////

    var dimensionFns= {
        'is_on_yelp': function(d) {
            return d['yelp_rating_count'] != null && 1<=d['yelp_rating_count']},

        'is_on_seamless': function(d) {
            return d['seamless_rating_count'] != null && 1<=d['seamless_rating_count']},

        'yelp_rating':  function(d) {
            if (d['yelp_rating'] == null) return null;
            return elih.math.roundToNearest( 0.1, d['yelp_rating'] )},

        'yelp_price': function( d ) {
            if (d['yelp_price'] == null) return null;
            return parseFloat( d['yelp_price'].toPrecision(3) )},

        'yelp_rating_count': function( d ) {
            if (d['yelp_rating_count'] == null) return null;
            if ( goodgross.HIGH_REVIEW_COUNT_THRESHOLD < d['yelp_rating_count'] ) return goodgross.HIGH_REVIEW_COUNT_THRESHOLD;
            return elih.math.ceilToNearest(  10, d['yelp_rating_count'] )},

        'seamless_rating': function(d) {
            if (d['seamless_rating'] == null) return null;
            return parseFloat( d['seamless_rating'].toPrecision(2) )},

        'seamless_price': function( d ) {
            if (d['seamless_price'] == null) return null;
            return parseFloat( d['seamless_price'].toPrecision(3) )},

        'seamless_rating_count': function( d ) {
            if (d['seamless_rating_count'] == null) return null;
            if ( goodgross.HIGH_REVIEW_COUNT_THRESHOLD < d['seamless_rating_count'] ) return goodgross.HIGH_REVIEW_COUNT_THRESHOLD;
            return elih.math.ceilToNearest(  10, d['seamless_rating_count'] )},

        'sanitation_score': function( d ) {
            if (d['sanitation_score'] == null || d['sanitation_score'] < 0 ) return -1;
            if ( goodgross.HIGH_SANITATION_SCORE_THRESHOLD < d['sanitation_score'] ) return goodgross.HIGH_SANITATION_SCORE_THRESHOLD;
            return elih.math.roundToNearest( 1, d['sanitation_score'] )},

        'median_zip_income': function( d ) {
            if (d['median_zip_income'] == null) return null;
            if ( goodgross.HIGH_HHI_THRESHOLD < d['median_zip_income'] ) return goodgross.HIGH_HHI_THRESHOLD;
            return elih.math.roundToNearest( 10000, d['median_zip_income'] )},

        'category': function( d ) {
            if (d['category'] == null || -1 == categories.indexOf( d['category'] )) return categories.indexOf( 'misc_restaurant' );
            return  categories.indexOf( d['category'] )},

        'city': function( d ) {
            if (d['city'] == null || -1 == cities.indexOf( d['city'] )) return null;
            return  cities.indexOf( d['city'] )
        }
    }


////////////////////////////////////////////////////
// Set up chart display properties
//////////////////////////

    var chartProperties= {}
    chartProperties['yelp_rating']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅", "","","★", "","","★★", "","","★★★", "","","★★★★", "","","★★★★★"],
        'marker-class-fn': function(d,i) {
            var output= ""
            output+= (  d.key != null ) ? " star-" + Math.round( d.key ) : ''
            return output }
    }

    chartProperties['yelp_price']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅", "$", "$$", "$$$", "$$$$"]
    }

    chartProperties['yelp_rating_count']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅","0-10","","", "100-110","","", "200-210","","", "300-310","","", "400-410","","", "500+"]
    }

    chartProperties['seamless_rating']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅", "","","★", "","","★★", "","","★★★", "","","★★★★", "","","★★★★★"],
        'marker-class-fn': function(d,i) {
            var output= ""
            output+= (  d.key != null ) ? " star-" + Math.round( d.key ) : '';
            return output }

    }

    chartProperties['seamless_price']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅", "$", "$$", "$$$", "$$$$", "$$$$$"]
    }

    chartProperties['seamless_rating_count']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅","0-10","","", "100-110","","", "200-210","","", "300-310","","", "400-410","","", "500+"]
    }

    var sanitationGrade= d3.scale.threshold().domain([0,14,28]).range(["", "A", "B", "C"])
    chartProperties['sanitation_score']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["∅","A", "","","",  "B", "","","",   "C", "","","",  "F"],
        'marker-class-fn': function(d,i) {
            var output= ""
            output+= (  d.key != null ) ? " sanitation-" + sanitationGrade( d.key ) : ''
            return output }
    }

    chartProperties['category']= {
        'width': 612, 'height': 127,
        'x-axis-values': categoryDisplayNames,
        'tooltip-text-fn': function( curData, curFilter ) {
            var validData= curData.filter( function(d) { return curFilter( d.key )})
            var validRestaurantCount= validData.reduce( function(l,r) {  return l + r.value; }, 0)
            var visibleRestaurantCount= curData.reduce( function(l,r) {  return l + r.value; }, 0)
            var categoryString= categoryDisplayNames[validData[0].key];
            if ( 12 < categoryString.length ) {
                categoryString= categoryString.slice(0,12) + "...";
            }
            return [formatLine1( validRestaurantCount ),  " (" + formatPercent( validRestaurantCount / visibleRestaurantCount ) + ")", "restaurants", categoryString];
        }
    }

    chartProperties['median_zip_income']= {
        'width': 180, 'height': 127,
        'use-brush': true,
        'x-axis-values': ["$20,000", "$40,000", "$60,000", "$80,000", "$100,000", "$120,000+" ],
        'tooltip-text-fn': function( curData, curFilter ) {
            var validData= curData.filter( function(d) { return curFilter( d.key )})
            var validRestaurantCount= validData.reduce( function(l,r) {  return l + r.value; }, 0)
            var visibleRestaurantCount= curData.reduce( function(l,r) {  return l + r.value; }, 0)
            var extent= d3.extent( validData.map( function(d) { return d.key }) )
            return [formatLine1( validRestaurantCount ), " (" + formatPercent( validRestaurantCount / visibleRestaurantCount ) + ")", "restaurants", "from $" + ((extent[0] || 0) / 1000).toFixed(0) + "k - $" +  ((extent[1] || 0 ) / 1000).toFixed(0) + "k"];
        }
    }

    chartProperties['city']= {
        'width': 180, 'height': 127,
        'x-axis-values': cityDisplayNames,
        'tooltip-text-fn': function( curData, curFilter ) {
            var validData= curData.filter( function(d) { return curFilter( d.key )})
            var validRestaurantCount= validData.reduce( function(l,r) {  return l + r.value; }, 0)
            var visibleRestaurantCount= curData.reduce( function(l,r) {  return l + r.value; }, 0)
            return [formatLine1( validRestaurantCount ),  " (" + formatPercent( validRestaurantCount / visibleRestaurantCount ) + ")","restaurants", cityDisplayNames[validData[0].key]];
        }
    }


    //Clean up / parse the data
    data= sanitizeData( data );
//    console.log( data.filter( function(d) { return d['sanitation_score'] != null && d['sanitation_score'] == 1}))

    //Apply any hard filters
//    data= data.filter( function( d ) { return d['yelp_price']})
//    data= data.filter( function( d ) { return d['yelp_rating_count'] != null })
    data= data.filter( function( d ) { return d['median_zip_income'] != null})
    data= data.filter( function( d ) { return d['sanitation_score'] != null && 0 <= d['sanitation_score']})
//    data= data.filter( function( d ) { return d['seamless_rating_count'] != null && 1<=d['seamless_rating_count']  })
//    data= data.filter( function( d ) { return d['category'] != null && -1 != categories.indexOf( d['category'] )  })

    //Add fake restaurant to force 1 star rating for seamless, 1 point for sanitation score
    data.push({'yelp_rating': 3, 'yelp_price': 0.2, 'yelp_rating_count': 1,
        'seamless_rating': 1, 'seamless_price': 0.2, 'seamless_rating_count': 1,
        'sanitation_score': 1, 'category': 'american', 'city': 'New York', 'median_zip_income': 50000})
    console.log( data.length )


    var dimensions= {}
    var groups= {}

    //Setup cross filter groups and dimensions
    var restaurant= crossfilter( data )
    var all= restaurant.groupAll()
    keys_(dimensionFns).forEach( function( curField ) {
        dimensions[curField]= restaurant.dimension( dimensionFns[curField] )
        groups[curField]= dimensions[curField].group()
    })


    var brushes= {}
    var charts= {}
    var chartTooltips= {}


    //Setup dimension filter functions
    //Initialize to just filter based on extent
    var defaultFilterCreatorFn= function(extent) {return function( d ) {return elih.math.withinRange( extent, d )}}
    var filterCreatorFns= fields.reduce( function( l, r) { l[r]= defaultFilterCreatorFn; return l}, {})

    //Initialize as always true
    var dimensionFilters= fields.reduce( function(l,r) { l[r]= function(){return true}; return l}, {})

    var filterByExact= function(curField, category) {
        dimensionFilters[curField]= function(d) { return d == category }// filterCreatorFns[curField](brushes[curField].extent())
        dimensions[curField].filter( dimensionFilters[curField] )
    }

    //Do initial filters
    dimensions['is_on_yelp'].filter(true)
    dimensions['is_on_seamless'].filter(true)










    ////////////////////////////////////////////////////
    // Set default chart properties
    //////////////////////////
//    var defaultBarClickFn=
    fields.forEach( function( curField, i ) {
        var curChartProperties= chartProperties[curField]
        curChartProperties['marker-class-fn']= curChartProperties['marker-class-fn']// || function(d,i) { return ( dimensionFilters[curField]( d.key ) ) ? '' : 'out-of-extent' }
        curChartProperties['value-fn']= curChartProperties['value-fn'] || function(d,i) { return d.value }
        curChartProperties['on-bar-click-fn']= curChartProperties['on-bar-click-fn'] || function(d) {

            d3.select('#chart-' + curField )
                .selectAll( '.tooltip-target')
                .call( function() { if ( this[0][0]) {
                    goog.dom.classlist.remove( this[0][0], 'tooltip-target') }})

            goog.dom.classlist.add( this, 'tooltip-target' );

            filterByExact( curField, d.key );
            updateAllCharts();

        }
        curChartProperties['tooltip-text-fn']= curChartProperties['tooltip-text-fn'] || defaultGetTooltipText
        curChartProperties['bar-modifier-fn']= curChartProperties['bar-modifier-fn'] || function(element, d,i){
            if ( dimensionFilters[curField]( d.key ) ) {
                goog.dom.classlist.remove( element, 'out-of-extent')
            } else {
                goog.dom.classlist.add( element, 'out-of-extent')
            }

        }
    })



    ////////////////////////////////////////////////////
    // Do initial render of the charts
    //////////////////////////
    fields.forEach( function( curField, i ) {

        //Convenience variables
        var curChartContainer= d3.select( target ).select( '#chart-' + curField ).select('.chart-container')//.append('g' ).attr('transform', 'translate(' + x + ', ' + y +')')
        var curChartProperties= chartProperties[curField]

        //Draw the axis
        var axisContainer= curChartContainer
            .append('g' )
            .attr('class', 'axis-labels')
            .attr('transform', 'translate(0,' + chartProperties[curField].height + ')')

        var xAxisValues= chartProperties[curField]['x-axis-values'] || []
        var xAxisCellRenderer= chartProperties[curField]['x-axis-cell-render-fn'] || diagonalTextCellFn
        renderGrid( axisContainer[0][0],
            xAxisValues.length,
            xAxisValues,
            {'width': chartProperties[curField].width,
                'height': 36,
                'cell-render-fn': xAxisCellRenderer})

        //Draw the chart
        var curChart= render1DBarChart( curChartContainer[0][0], curChartProperties )
        charts[curField]= curChart

        //Draw the tooltip
        chartTooltips[curField]= renderTooltip( d3.select( target ).select( '#chart-' + curField )[0][0] )

        d3.select( curChart )
            .on('mouseover', function(d) { showTooltip( chartTooltips[curField])})
            .on('mouseout', function(d) { hideTooltip( chartTooltips[curField])})




    })




    ////////////////////////////////////////////////////
    // Charts update function
    //////////////////////////

   function updateAllCharts() {
        fields.forEach( function( curField ) {
            var curData= groups[curField].all()//.filter( function(d) { return d.key != null })
            update1DBarChart( charts[curField], curData, chartProperties[curField])
            updateTooltip( charts[curField], chartTooltips[curField], curData, dimensionFilters[curField], chartProperties[curField]['tooltip-text-fn'] );
//            console.log( curData )
        })
    }

    //Update charts for the first time
    updateAllCharts();



    ////////////////////////////////////////////////////
    // Setup brushes & brush actions
    //////////////////////////

    //Only uses brushes on big screens
    if ( isMobile() == false ) {
        fields.filter( function( curField ) { return chartProperties[curField]['use-brush']})
            .forEach( function( curField ) {


                var curChart= charts[curField]
                var curData= groups[curField].all()//.filter( function(d) { return d.key != null })
                var curChartProperties= chartProperties[curField]

                var barDelta= elih.math.roundToNearest(0.1, curData[2].key - curData[1].key );

                var numBars= curData.length
                var numBarsNonNull= curData.filter( function(d) { return d.key != null } ).length

                var brushDomain= d3.extent( curData.map( function(d){ return d.key }));
                //Extend the domain right, to end on the right of the last bar
                brushDomain[1]*= (1 + (1/numBarsNonNull));

                var brushRange= [0, curChartProperties.width];
                //If the non-matched column exists
                if ( curData[0].key == null ) {
                    //adjust the range so it can't be brushed over
                    brushRange[0]= curChartProperties.width / numBars
                }

                var brushScale= d3.scale.linear()
                    .domain( brushDomain )
                    .range(brushRange)
                    .clamp([true])

                //Create the brush
                var curBrush= d3.svg.brush()
                    .x(brushScale)

                //Apply the brush
                d3.select( curChart )
                    .append("g")
                    .attr("class", "x brush")
                    .call(curBrush)
                    .selectAll('rect')
                    .attr("height", curChartProperties.height)

                //Add handles to the extent
                d3.select( curChart )
                    .selectAll('g.brush .resize')
                    .append('path')
                    .attr('d', "M 0 0 L 0 " + curChartProperties.height )
                    .attr('class', 'resize-handle')

                curBrush.on("brush", function() {
//                console.log( this )
//                if (!d3.event.sourceEvent) return;
                        if ( false == brushes[curField].empty() ) {
                            var brushExtent= brushes[curField].extent()
                            var filterExtent= []

                            var extentWidth= 0;
                            if ( d3.event.mode == "move" ) {
                                extentWidth= elih.math.roundToNearest( barDelta, brushExtent[1] - brushExtent[0] )
                                filterExtent[0]= elih.math.roundToNearest( barDelta, brushExtent[0] )
                                filterExtent[1]= filterExtent[0] + extentWidth
                            } else {
                                filterExtent[0]= elih.math.floorToNearest( barDelta, brushExtent[0] )
                                filterExtent[1]= elih.math.ceilToNearest( barDelta, brushExtent[1] )

                            }

                            //Deal with rounding error
                            filterExtent[0]= elih.math.preciseFloat( filterExtent[0] )
                            filterExtent[1]= elih.math.preciseFloat( filterExtent[1] )

                            dimensionFilters[curField]= filterCreatorFns[curField](filterExtent)
                            dimensions[curField].filter( dimensionFilters[curField] )
                            brushes[curField].extent(filterExtent)
                            d3.select(this )//.transition()
                                .call(brushes[curField].extent(filterExtent))

                            //Set the brush's extent as the tooltip target
                            attachTooltip( d3.select( curChart ).select('g.brush .extent')[0][0] )

                        }

                        updateAllCharts();
                    }

                )

                brushes[curField]= curBrush
            })
    }





    ////////////////////////////////////////////////////
    // Set up various buttons / toggles
    //////////////////////////

    //filter Yelp only data toggle
    d3.select( target )
        .select( '#yelp-toggle' )
        .on( 'click', function() {
            var curState= d3.select(this ).text()
            if ( curState === 'matches' ) {
                curState= 'all';
                dimensions['is_on_yelp'].filterAll()
            } else {
                curState= 'matches';
                dimensions['is_on_yelp'].filter(true);
            }
//            console.log( curState );
            d3.select(this ).text( curState );
            updateAllCharts();
        })

    //filter seamless only data toggle
    d3.select( target )
        .select( '#seamless-toggle' )
        .on( 'click', function() {
            var curState= d3.select(this ).text()
            if ( curState === 'matches' ) {
                curState= 'all';
                dimensions['is_on_seamless'].filterAll()
            } else {
                curState= 'matches';
                dimensions['is_on_seamless'].filter(true);
            }

            d3.select(this ).text( curState );
            updateAllCharts();
        })


    //Setup reset buttons
    fields.forEach( function( curField ) {
        d3.select( target )
            .select('#chart-' + curField )
            .select('.reset-button')
            .on( 'click', function() {

                var curBrush= brushes[curField]

                //Clear the extent
                if ( curBrush ) {
                    d3.select( target )
                        .select('#chart-' + curField )
                        .select('.brush')
                        .call(curBrush.clear())

                }

                //Detach the tooltip target
                detachTooltip( d3.select('#chart-' + curField )[0][0] )

                dimensions[curField].filterAll();
                dimensionFilters[curField]= function(d) { return true }
                updateAllCharts();

            })
    })


}
