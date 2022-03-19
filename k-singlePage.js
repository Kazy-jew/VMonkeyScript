// ==UserScript==
// @name         konachan Dates
// @version      1.0
// @match        https://konachan.com/post*tags=date*
// @grant        GM_download
// ==/UserScript==

var interval = 1000*Math.random()
var retryInterval = 10000;
var startTime, endTime, deltaTime;

var maxRetry = 2;

var imageData = [];
var failedData = [];
var pageImage = [];
var currentDownloadIndex = 0;
var currentRetry = 0;
var index = 0;

(function () {
  // startTime = new Date();
  // console.log(startTime);
  let pageImages = getImagelist();
  console.log(pageImages);
  getImageLink(pageImages);
  // getImagelist();
  // getImageLink();
  // startDownload();
  // deltaTime = (endTime-startTime)/1e3;
  // console.log("%cDownload Took: " + deltaTime + ' seconds', "color: red")
    // getImageData();
    // downloadImage();
})()

function getPages() {
  pageURL = []
  let pages = document.querySelector("#paginator > div").innerText.split(' ').slice(-3, -2)
  pages = parseInt(pages[0])
  let date = window.location.href.split('%3A')[1]
  for(let i=1; i<pages+1; i++) pageURL.push("https://konachan.com/post?page="+i+"&tags=date%3A"+date)
  console.log(pageURL)
  pageURL.forEach(function(item){
    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      let document = this.responseXML;
      let imageList = getImagelist(document);
      getImageLink(imageList);
    }
    xhr.open("GET", item);
    xhr.responseType = "document";
    xhr.send();
  })
}

function getImagelist() {
  let imageLink = []
  let imageLists = document.querySelector("#post-list-posts").childNodes;
  for(let i=0; i<imageLists.length; i++) {
    if(imageLists[i].id) imageLink.push('https://konachan.com/post/show/'+ imageLists[i].id.replace('p', ''))
  }
  return imageLink
}

function getImageLink(imageList) {
  imageList.forEach(function(item){
    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      let document = this.responseXML;
      let element = document.querySelector("#png") || document.querySelector("#highres");
      let img_link = element.href;
      let img_name = decodeURIComponent(img_link.split('/').slice(-1)[0]).replace(/[[\/\\?*:|"<>]]/g, '_');
      imageData.push({
        name: img_name,
        link: img_link
      });
      downloadImage(img_link, img_name)
      // pageImagelink.push(img_link);
      // console.log(pageImagelink)
    }
    xhr.open("GET", item);
    xhr.responseType = "document";
    xhr.send();
  });
}

function startDownload() {
  if(!imageData.length)
    {
        console.log("Can't find image data!");
        return;
    }
  if(currentDownloadIndex < 0 || currentDownloadIndex >= imageData.length)
    {
      endTime = new Date();
      console.log("Done!");
      console.log("Fails: " + failedData.length);
      if(failedData.length) console.log(failedData);
      return;
    }
  var link = imageData[currentDownloadIndex].link,
      name = imageData[currentDownloadIndex].name;
  console.log(currentDownloadIndex + " %cDownload Start!", "color: mediumseagreen");
  downloadImage(link, name)
}

function downloadImage(link, name) {
    var arg = {
        url: link,
        name: name,
        saveAs: false,
        // onerror: onError,
        onload: onLoad,
        // onprogress: onProgress,
        ontimeout: onTimeout
    };
    GM_download(arg);
}

function retry() {
    currentRetry++;
    if (currentRetry <= maxRetry) {
        console.log("Retry! " + currentRetry);
        setTimeout(downloadImage, retryInterval);
    } else {
        failedData.push({
            name: imageData[currentDownloadIndex].name,
            link: imageData[currentDownloadIndex].link
        })
        currentDownloadIndex++;
        currentRetry = 0;
        setTimeout(startDownload, interval);
    }
}

function onLoad() {
    console.log(currentDownloadIndex+1 + " %cDownload Completed!", "color: mediumseagreen");
    currentDownloadIndex++;
    // currentRetry = 0;
    // setTimeout(startDownload, interval);
}

function onError(err) {
    console.log("%cError! Reason: " + err.error, "color: crimson");
    // retry();
}

function onProgress() {
    console.log("%cDownloading...", "color: chartreuse");
}

function onTimeout() {
    console.log("%cTimeout!" + imageData[currentDownloadIndex].link, "color: brown");
    // retry();
}

