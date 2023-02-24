import React from 'react';
import './addEvaluation.css';

import { Button } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardMedia from '@material-ui/core/CardMedia';
import Card from '@material-ui/core/Card';

import Box from '@material-ui/core/Box';
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FormControl from '@material-ui/core/FormControl';
import NativeSelect from '@material-ui/core/NativeSelect';

// Image imports
import corn from './images/corn.jpeg';
import corn2 from './images/corn2.jpeg';
import wheat from './images/wheat.jpeg';
import wheat2 from './images/wheat2.jpeg'; 
import triticale from './images/triticale.jpeg';
import triticale2 from './images/triticale2.jpeg';
import rays from './images/rays.jpeg';
import rays2 from './images/rays2.jpeg';

//tensorflow
import * as tf from '@tensorflow/tfjs';
import {loadGraphModel} from '@tensorflow/tfjs-converter';
import "core-js/stable";
import "regenerator-runtime/runtime";
tf.setBackend('webgl');

// Mapping of the classes
let classesDir = {
  1: {
      name: 'Corn',
      id: 1,
  },
  2: {
      name: 'Rays',
      id: 2,
  },
  3: {
    name: 'Triticale',
    id: 3,
  },
  4: {
    name: 'Wheat',
    id: 4,
  },
}

// Loading the models
async function load_ssd_model() {
  await tf.ready();
  model_name = "ssd"
  try {
    const model = await loadGraphModel('/models/ssd_js/model.json');
    return model;
  } catch(e) {
    console.log("The SSD model could not be loaded")
  }
}

async function load_rcnn_model() {
  model_name = "frcnn"
  await tf.ready();
  try {
    const model = await loadGraphModel('/models/rcnn_js/model.json');
    return model;
  } catch(e) {
    console.log("The RCNN model could not be loaded")
  }
}


// Processing the input
function process_input(img){
  const tfimg = tf.browser.fromPixels(img).toInt();
  const tfimgResized = tf.image.resizeNearestNeighbor(
  												tfimg, [512,512], true
  											);
  const expandedimg = tfimgResized.expandDims();
  return expandedimg;
};

async function detectFrame(img_url, model) {
  var feedback = document.getElementById('feedbackPredict');

  feedback.innerText = "Predicting...";
  feedback.style.color = "Red";
  await tf.ready();
  var img = new Image();
  var src = document.getElementById('canvasTop');
  img.src = img_url;
  img.onload = function()
  	{
  	console.log(``)
  	}
  	
  img.id = "imgCanvas";
  
  img.width = 512; //has to be defined for tensorflow pixel
  img.height = 512; // ^^

  //needs to be appended somewhere else or otherwise be made visible
  src.appendChild(img);

  Promise.all([model])
    .then(values => {
      tf.engine().startScope();
      values[0].executeAsync(process_input(img)).then(predictions => {
      renderPredictions(predictions, img);
      tf.engine().endScope();
    })
    .catch(error => {
      console.error(error);
    });
  });
};

function buildDetectedObjects(scores, threshold, boxes, classes, classesDir) {
  const detectionObjects = []
  var imgCanvas = document.getElementById('imgCanvas');
  scores[0].forEach((score, i) => {

    if (score > threshold) {
      const bbox = [];
      const minY = boxes[0][i][0] * imgCanvas.offsetHeight;
      const minX = boxes[0][i][1] * imgCanvas.offsetWidth;
      const maxY = boxes[0][i][2] * imgCanvas.offsetHeight;
      const maxX = boxes[0][i][3] * imgCanvas.offsetWidth;
      bbox[0] = minX;
      bbox[1] = minY;
      bbox[2] = maxX - minX;
      bbox[3] = maxY - minY;
      detectionObjects.push({
        class: classes[0][i],
        label: classesDir[classes[0][i]].name,
        score: score.toFixed(4),
        bbox: bbox
      })
    }
  })
  return detectionObjects
}


function renderPredictions(predictions, img) {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";


    //Getting predictions
    // FRCNN
    var boxes = predictions[3].arraySync();
    var num = predictions[1].dataSync();
    var scores = predictions[2].arraySync();
    var classes = tf.tensor(predictions[0].arraySync()).arraySync();

    // If SSD-model change ordering of prediction
    if (model_name === "ssd") {
      boxes = predictions[2].arraySync();
      num = predictions[1].dataSync();
      scores = predictions[3].arraySync();
      classes = tf.tensor(predictions[0].arraySync()).arraySync();
    }

    const detections = buildDetectedObjects(scores, threshold,
                                    boxes, classes, classesDir);

    
    detections.forEach(item => {
      const x = item['bbox'][0];
      const y = item['bbox'][1];
      const width = item['bbox'][2];
      const height = item['bbox'][3];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(item["label"] + " " + (100 * item["score"]).toFixed(2) + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
  });

  detections.forEach(item => {
    const x = item['bbox'][0];
    const y = item['bbox'][1];

    // Draw the text last to ensure it's on top.
    ctx.fillStyle = "#000000";
    ctx.fillText(item["label"] + " " + (100*item["score"]).toFixed(2) + "%", x, y);
  });
  var feedback = document.getElementById('feedbackPredict');
  feedback.innerText = "Ready!";
  feedback.style.color = "rgb(43, 78, 54)";
};


// List of images
const itemData = [
  {
    img: corn,
    title: 'Corn',
  },
  {
    img: corn2,
    title: 'Corn',
  },
    {
    img: wheat,
    title: 'Wheat',
  },
  {
    img: wheat2,
    title: 'Wheat',
  },
  {
    img: triticale,
    title: 'Triticale',
  },
  {
    img: triticale2,
    title: 'Triticale',
  },
  {
    img: rays,
    title: 'Rays',
  },
  {
    img: rays2,
    title: 'Rays',
  },
  
];

// the Threshhold for the detected objects, the user could also choose it
var threshold = 0.5;

// Load the ssd model as initial model
var model_name = "ssd";
var currentModel = load_ssd_model();

// Canvas to draw on
var canvasRef = React.createRef();
var hiddenCanvasRef = React.createRef();
var a = "Ready!";


class AddEvaluation extends React.Component {
  constructor(props){
    super(props);
    this.state= {
      imgPred: "images/pred_init.svg",
      feedbackPredict: a
    };
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleClickCard = this.handleClickCard.bind(this)
    this.downloadCanvas = this.downloadCanvas.bind(this)
  }

  downloadCanvas(event){
    // get canvas
    var myCanvas = document.getElementById("canvasTop");

    // Overlay images
    var dataURL = myCanvas.toDataURL("image/png");
    var a = document.createElement('a');
    a.href =  dataURL;
    a.download = `prediction_${model_name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }


  handleInputChange(event) {
  	const maxRes = 512;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var img = new Image()
    var imgUrl = URL.createObjectURL(event.target.files[0])
    img.src = imgUrl



    

    img.onload = (() => 
  	{

        var newHeight = maxRes;
        var newWidth = maxRes;

        if ( img.width > img.height) {
          newHeight = maxRes / img.width * img.height;
        } else {
          newWidth = maxRes / img.height * img.width;
        }

        
        var canvasHidden = document.createElement('canvas'),
        ctxHidden = canvasHidden.getContext('2d');


        // set its dimension to target size
        canvasHidden.width = 512;
        canvasHidden.height = 512;

        // draw source image into the off-screen canvas: 
        ctxHidden.drawImage(img, 0, 0, 512, 512);

      // Create URL Object
      this.setState({
        imgPred: canvasHidden.toDataURL()
      });

  	});
  }

  handleClickCard(img) {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.setState({
      imgPred: img
    })
  }

  handleMenuChange(event) {
    if (event.target.value === "ssd") {
      currentModel = load_ssd_model();
    } else {
      currentModel = load_rcnn_model();
    }
  }

  handleClickCard2(imgSrc) {
    const ctx = canvasRef.current.getContext("2d");
    var img = new Image()
    img.src = imgSrc
    img.onload = function() {
    	const tfImg = tf.browser.fromPixels(img);
    	const tfImgResized = tf.image.resizeNearestNeighbor(
  												tfImg, [512,512], true
  											);
      ctx.drawImage(tfImgResized, 0, 0);
    };
  }
  returnImageURL() {
    var predCanvas = document.getElementById("canvasTop");
    var dataURL = predCanvas.toDataURL("image/png");
    return dataURL
  }

  // Scroll to the original position after page entering
  componentDidMount() {
    window.scrollTo(0, 0)
  }
  
  render() {
    return (
        <div className= "Detection">
        <><Navbar />

        <div style={{display: 'flex', justifyContent: 'center', padding: '5%'}}>
          <Grid container spacing={6}>
              <div style={{display: 'flex', gap: '40px'}}>
                <div>
                  <h1>Select an image</h1>
                  <br></br>
                  <ImageList sx={{heigth:128, width:128}} cols={2} rowHeight={256}>
                      {itemData.map((item) => (
                        <ImageListItem key={item.img}>
                              <CardActionArea>
                                <CardMedia
                                  component="img"
                                  src={`${item.img}?w=164&h=164&fit=crop&auto=format`}
                                  srcSet={item.img}
                                  alt={item.title}
                                  title={item.title}
                                  height='256'
                                  onClick={() => this.handleClickCard(item.img)}
                                  />
                              </CardActionArea>
                        </ImageListItem>
                      ))}
                    </ImageList>
                </div>
              <div>
                  <h1>Model detection</h1>
                  <br></br>

                  <div style={{display: 'flex', gap: '30px', justifyContent: 'center'}}>
                  <Box sx={{height:'auto', width: '45%'}}>
                      <FormControl fullWidth variant="filled" color="primary">
                          <NativeSelect
                              id="modelID"
                              defaultValue={model_name}
                              color='primary'
                              onChange={this.handleMenuChange}
                              style={{background: "#D3D3D3", value: "M", height: '50px', width: '180px', paddingInlineStart:'8px', borderRadius:'5px'}}
                          >
                          <option value="ssd">SSD MobileNetV1</option>
                          <option value="frcnn">Faster R-CNN</option>
                          </NativeSelect>
                      </FormControl>
                      </Box>
                      <Button
                       variant="contained"
                       color='inherit'
                       size='large'
                       onClick={() => detectFrame(this.state.imgPred, currentModel)}>
                      Predict image
                      </Button>
                  </div>
                  <h3 id='feedbackPredict' style={{color: 'rgb(43, 78, 54)'}}>{this.state.feedbackPredict}</h3>
                  <Card>
                  <div id="wrapper">
                    <img src={this.state.imgPred} alt="predict image"/>
                  <canvas
                        className="size"
                        id="canvasTop"
                        ref={canvasRef}
                        width="512"
                        height="512"
                      />
                  <canvas
                        className="size"
                        id="hiddenCanvas"
                        ref={hiddenCanvasRef}
                        width="512"
                        height="512"
                        hidden
                      />
                 </div>
                  </Card>
                  <br></br>
                 <div style={{display: 'flex', justifyContent: 'center'}}>
                 <div style={{display: 'flex', justifyContent: 'left'}}>
                  <label className="custom-file-upload">
                  <input type="file" onChange={this.handleInputChange}/>
                     <i className="fa fa-cloud-upload" variant="contained"></i> UPLOAD IMAGE
                  </label>
                  </div>
                  <div className="download" style={{display: 'flex', justifyContent: 'right'}} onClick={() => this.downloadCanvas(this.state.imgPred)} > 
                  
                  <label className="custom-file-download">
                     <i className="fa fa-cloud-download" variant="contained" ></i> DOWNLOAD IMAGE
                  </label>

                  </div>

                  </div>

                </div>
                <div>
                <br></br><br></br><br></br><br></br>
                <br></br><br></br><br></br><br></br>
                <h1>Explanation</h1>
                <br></br>
                  <p>
                    The image desiplayed in the left canvas will be predicted when the button 'PREDICT IMAGE' is pressed.<br/>
                    The drop down menue gives the option to choose between the SSD and FRCNN model.<br/>
                    A image can be either chosen by clicking on one of the images provided in the left panel or uploaded from a local file.<br/>
                    While predicting different resolutions is possible with the models the canvas is optimized to display images with 512x512 pixels.<br/>
                    All uploaded images will be resized to this resolution, so that the performance of the models might suffer significant.<br/>
                    The (predicted) images can can be downloaded.

                  </p>
                </div>
           </div>
          </Grid>
        </div>
        {/* Some spacing  */}
        <br></br> <br></br> <br></br> <br></br>
        <br></br> <br></br> <br></br> <br></br>

        <Footer />
        </>
        </div>
        );
    }
  }

 export default AddEvaluation;



