// ==UserScript==
// @name         Yande.re Dates
// @version      1.0
// @match        https://yande.re/post*tags=date*
// @require      https://releases.jquery.com/git/jquery-3.x-git.min.js
// @grant         GM_download
// ==/UserScript==


var retryInterval = 10000;

var maxRetry = 2;

var imageData = [];
var failedData = [];
var pageImage = [];
var currentDownloadIndex = 0;
var currentRetry = 0;


(function () {
  getImagelist()
    // getImageData();
    // downloadImage();
})()

function reqListener () {
  console.log(this.responseText);
}

function getImagelist() {
  var imageId = [];
  var imageLists = document.querySelector("#post-list-posts").childNodes;
  console.log(imageLists.length)
  for(let i=0; i<imageLists.length; i++) {
    if(imageLists[i].id) imageId.push(imageLists[i].id.replace('p', ''))
  }
  pageImage = imageId.map(x => 'https://yande.re/post/show/' + x);
  console.log(pageImage);
  let xhr = new XMLHttpRequest();
  xhr.addEventListener("load", reqListener);
  xhr.open('GET', pageImage[0]);
  xhr.send()
  // xhr.responseType = 'blob'
  // console.log(xhr.response)
}

function getImageData() {
    var elements = document.querySelector("#png") || document.querySelector("#highres");
    var img_link = elements.href;
    var img_name = decodeURIComponent(img_link.split('/').slice(-1)[0]).replace(/[[\/\\?*:|"<>]]/g, '_');
    // console.log(img_link, img_name)
    imageData.push({
        name: img_name,
        link: img_link
    });
    if (!elements) return
}

function downloadImage() {
    if (!imageData.length) {
        console.log('%cImage not exist...', 'color: blueviolet');
        return
    }
    console.log(imageData[0].link, imageData[0].name);
    var arg = {
        url: imageData[0].link,
        name: imageData[0].name,
        saveAs: false,
        onerror: onError,
        onload: onLoad,
        onprogress: onProgress,
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
            name: imageData[0].name,
            link: imageData[0].link
        })
    }
}

function onLoad() {
    console.log("%cDownload Completed!", "color: mediumseagreen");
}

function onError(err) {
    console.log("%cError! Reason: " + err.error, "color: crimson");
    retry();
}

function onProgress() {
    console.log("%cDownloading...", "color: chartreuse");
}

function onTimeout() {
    console.log("%cTimeout!" + imageData[0].name, "color: brown");
    retry();
}
