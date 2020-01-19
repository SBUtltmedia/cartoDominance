var popFactory = {
  pieChartData:"",
  popUpCount: 0,
  newPopUp: function(featureEvent) {

    var areaname = featureEvent.data.areaname
    this.popUpCount++;

    var popUp = $('<div/>', {
      id: `popUp${this.popUpCount}`,
      class: "popUp",
      style: "cursor:cell; text-align:center;",
      html: areaname
    });

    var textDiv = $('<div/>', {
      id: 'titleText',
      style: "text-align:center"
    });
    var pieChart = $('<div/>', {
      id: `pieChart${this.popUpCount}`,
      style: "margin:auto; position:absolute; top: calc(50% - 150px); left: calc(50% - 250px); display:block; align-items:center"
    });
    var crossSVG = $(popFactory.xCross);
    var pinSVG = $(popFactory.SVGstr);
// console.log(popFactory.popUpCount)
    // Appends each part to the base
    popUp.append(crossSVG);
    popUp.append(textDiv)
    popUp.append(pieChart);
    popUp.append(pinSVG);

    // Edits to the attributes and css of the parts

    //---------------------\\


    crossSVG.css({
      "left": "94%",
      "top": "2%",
      "position": "absolute",
      "display": "block"
    });
    pinSVG.attr("id", "pin_" + this.popUpCount);
    pinSVG.css({
      "left": "2%",
      "top": "94%",
      "position": "absolute",
      "display": "block"
    });
    pinSVG.css("display", "block");
    //---------------------\\

    // When either svg is clicked then they perform their own functions
    //---------------------\\
    crossSVG.on("click", function(evt) {
      popUp.remove();
      this.popUpCount--;
    })

    pinSVG.on("click", function(evt) {
      $(this).toggleClass("pinned");
    })
    //---------------------\\

    // Append the DIV to the div found in the index file
    // Displays it on the website
    $('#popUpHolder').append(popUp);

    // Makes the div draggable
    dragElement(document.getElementById(popUp.attr('id')));

    return popFactory.popUpCount;
  },
  xCross:`<svg width="15px" height ="15px">
          <line x1="0" y1="0" x2="15px" y2="15px" style="stroke:#ff0000; stroke-width:1.5"></line>
          <line x1="0" y1="15px" x2="15px" y2="0" style="stroke:#ff0000; stroke-width:1.5"></line>
      </svg>`,
 SVGstr :`<svg width="20px" height ="20px" version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      	 viewBox="0 0 8 8" style="enable-background:new 0 0 0 0;" xml:space="preserve">
          <g transform="scale(.03)" class="green">
      <path d="M160.7,204.1c-37.6-37.7-75-75-112.5-112.6c9.7-10,21.9-16.4,35.6-20.1c12-3.2,24.1-3.1,36.2-0.7c4.2,0.8,6.4-0.2,8.7-3.4
      	c12.9-18,25.8-36,38.8-53.9c2.4-3.4,5-6.7,7.8-9.7c4.4-4.7,8.3-4.7,12.8-0.1c20.2,20.3,40.2,40.9,60.5,61.1c4.7,4.6,3.2,11.8-1.5,15
      	c-5.5,3.8-10.9,7.7-16.4,11.4c-15.7,10.7-31.3,21.5-47.1,32.1c-2.6,1.7-3.4,3.3-2.7,6.5c5.5,24.6,1.1,47.3-14,67.7
      	c-1.3,1.7-2.7,3.4-4.2,5C162.2,202.9,161.4,203.5,160.7,204.1z M157.2,87.5c14-12.8,28.1-25.5,42-38.4c0.7-0.7,1.1-3.1,0.5-3.7
      	c-5-5.3-10.2-10.3-15.7-15.7c-10.5,13.4-20.5,26.1-30.5,38.8c-7.7,9.9-7.7,9.9,1.9,18.2C155.8,86.9,156.1,87,157.2,87.5z
      	 M136.9,99.6c-2.2-2.2-4.3-4.5-6.8-6.5c-1.6-1.3-3.7-2.8-5.5-2.7c-12,0.7-22.2,5.9-32.1,13.1c6.3,5.8,12.2,11.4,18.2,17
      	C118.8,114.1,127.6,107,136.9,99.6z"/>
      <path d="M0,251.5c26.8-35,53.7-70,80.3-104.6c8.4,8.3,16.6,16.4,25.3,24.9c-34.8,26.7-69.9,53.6-104.9,80.4
      	C0.5,252,0.2,251.7,0,251.5z"/>
          </g>
      </svg>`,
      pieConfig :() =>{

        return {
    "header": {
      "title": {
        "text": popFactory.headerText,
        "fontSize": 10
      },
      "subtitle": {
        "text": "Total Latino Population",
        "color": "#000",
        "fontSize": 7,
        "font": "open sans"
      },
      "location": "pie-center",
      "titleSubtitlePadding": 2.5
    },

    "size": {
      "canvasHeight": 300,
      "canvasWidth": 500,
      "pieInnerRadius": "55%",
      "pieOuterRadius": "78%"
    },
    "data": {
      "sortOrder": "label-desc",
      "content": popFactory.pieChartData,
      // "smallSegmentGrouping" : {"enabled" : true, "value" : 2, "valueType": "percentage", "label" : "test" }
    },
    "labels": {
      "outer": {
        "format": "label-value2",
        "pieDistance": 10
      },
      "inner": {
        "hideWhenLessThanPercentage": 1.5
      },
      "mainLabel": {
        "fontSize": 8
      },
      // "percentage" : {"color" : "#000", "fontSize" : 9, "decimalPlaces" : 0},
      "value": {
        "color": "#000",
        "fontSize": 8
      },
      "lines": {
        "enabled": true,
        "color": "#777777"
      },
      "truncation": {
        "enabled": false
      }
    },
    "effects": {
      "load": {
        "speed": 750
      },
      "pullOutSegmentOnClick": {
        "effect": "none",
        "speed": 200,
        "size": 8
      }
    },
    "misc": {
      "colors": {
        "segmentStroke": "#000000"
      }
    }
  }
}


}


// Event Handler for Mousedown and Drag
function dragElement(elmnt) {
  // console.log(elmnt);
  // elmnt = the element being moved
  // Starting position of the element
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

  // When an element is held the mouse can move it downwards
  function dragMouseDown(e) {
    // e is the event to move the window
    e = e || window.event;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // if the mouse is let go of the draging stops
    document.onmouseup = closeDragElement;
    // If the mouse is moved while being held down then the element moves
    document.onmousemove = elementDrag;
  }
  // Follows mouse and moves the element with it
  function elementDrag(e) {
    e = e || window.event;
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }
  // Stops the following of the element with the mouse
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }





}

// Configure pop up svgs
