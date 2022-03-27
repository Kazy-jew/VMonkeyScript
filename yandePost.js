// ==UserScript==
// @name         Yande.re Downloader
// @version      1
// @match        https://yande.re/post/show/*
// @grant         GM_download
// ==/UserScript==


// ダウンロードが失敗したあともう一度ダウンロードをやり直すまでの時間
var retryInterval = 10000;
// ダウンロードが失敗したあと再試行する回数
var maxRetry = 2;

var imageData = [];
var failedData = [];
var currentDownloadIndex = 0;
var currentRetry = 0;


(function () {
    download_tips();
    getImageData();
    downloadImage();
})()

function getImageData() {
    var elements = document.querySelector("#png") || document.querySelector("#highres");
    var img_link = elements.href;
    var img_name = decodeURI(img_link).split('/').slice(-1)[0]
    // console.log(img_link, img_name)
    imageData.push({
        name: img_name,
        link: img_link
    });
    if (!elements) return
}

function downloadImage() {
    if (!imageData.length) {
        console.log('Image not exist...');
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

function download_tips() {
    var logList = [];
    const arr = ["Downloading", ""];
    const div = document.createElement('div');
    const ul = document.createElement("ul");
    const li1 = document.createElement('li');
    const li0 = document.createElement('li');
    li0.innerHTML = arr[0];
    li1.innerHTML = arr[1];
    ul.appendChild(li0);
    ul.appendChild(li1);
    li0.classList.add('progress');
    li1.classList.add('result');
    li0.id = 'tip1';
    li1.id = 'tip2';
    // li.setAttribute ('style', 'display: block;');
    div.classList.add('download_tip');
    div.id = ('moe_download');
    ul.setAttribute('style', 'padding: 0; margin: 0;');
    ul.setAttribute('id', 'theList');
    div.appendChild(ul);
    logList.push(div);
    insertToHead(div);
}

function set_tips(tips) {
    var result = document.querySelector("#tip2");
    result.innerHTML = tips
}

function insertToHead(ele) {
    document.querySelector("#header").insertAdjacentElement('beforebegin', ele);
    return ele
}

function onLoad() {
    set_tips("Complete!");
    console.log("Download Completed!");
}

function onError(err) {
    console.log("Error! Reason: " + err.error);
    retry();
}

function onProgress() {
    console.log("Downloading...");
}

function onTimeout() {
    console.log("Timeout!" + imageData[0].name);
    retry();
}