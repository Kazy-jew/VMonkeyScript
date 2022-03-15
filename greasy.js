// ==UserScript==
// @name         Wikiart Image Downloader
// @version      1
// @match        https://www.wikiart.org/en/*/all-works/text-list
// @grant        GM_download
// ==/UserScript==
 
'use strict';
 
 
// 作品のダウンロードが完了してから次の作品のダウンロードを開始するまでの時間
var interval = 2000;
// ダウンロードが失敗したあともう一度ダウンロードをやり直すまでの時間
var retryInterval = 10000;
// ダウンロードが失敗したあと再試行する回数
var maxRetry = 2;
 
var imageData = [];
var failedData = [];
var currentDownloadIndex = 0;
var currentRetry = 0;
 
(function() {
    getImageData();
    startDownload();
})();
 
// 作品一覧ページのDOMを読み込んで各情報を配列にブチ込む
function getImageData()
{
    const elements = document.querySelectorAll(".painting-list-text-row a[href]");
    if(!elements) return;
 
    for(let i=0; typeof(elements[i])!='undefined'; i++)
    {
        const artist = elements[i].getAttribute('href').match(/\/en\/(.+)\/.+/)[1];
        const paintingTitle = elements[i].textContent;
        const paintingId = elements[i].getAttribute('href').match(/\/en\/.+\/(.+)/)[1];
        const yearElement = elements[i].parentNode.querySelector("span");
        const year = yearElement ? yearElement.textContent.replace(/[^0-9]/g, "") : "";
        imageData.push({ artist: artist, year: year, paintingTitle: paintingTitle, paintingId: paintingId });
    }
}
 
// 作品のダウンロードを開始する
function startDownload()
{
    if(!imageData.length)
    {
        console.log("Can't find image data!");
        return;
    }
 
    // 最後まで完了したらダウンロードに失敗した作品をコンソールに表示して終了
    if(currentDownloadIndex < 0 || currentDownloadIndex >= imageData.length)
    {
        console.log("Done!");
        console.log("Fails: " + failedData.length);
        if(failedData.length) console.log(failedData);
        return;
    }
 
    const image = imageData[currentDownloadIndex];
    const altURL = "https://uploads0.wikiart.org/images/" + image.artist + "/" + image.paintingId + ".jpg"; // 画像URL取得に失敗したとき用の保険URL
 
    // ファイル名は "発表年 作品名.jpg"
    let filename = image.paintingTitle + ".jpg";
    if(image.year) filename = image.year + " " + filename;
    filename = filename.replace(/[\/\\?%*:|"<>]/g, ""); // 禁止文字は消去
 
    // 実際に個別の作品ページを見に行く→DOMを分析して画像のURLを取得
    fetch("https://www.wikiart.org/en/" + image.artist + "/" + image.paintingId)
        .then(response => {
            response.text().then(text => {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(text, "text/html");
                const imgElement = htmlDoc.querySelector("img[itemprop='image']");
                const imageURL = imgElement.getAttribute('src').replace(/!.+/, "");
                start(imageURL);
            })
            .catch(() => { start(altURL); })
    })
    .catch(() => { start(altURL); });
 
    function start(url)
    {
        console.log("Download Start!: " + image.paintingTitle + "(" + currentDownloadIndex + ")");
        download(url, filename);
    }
}
 
// GM_download()を使ってローカルフォルダに指定したファイルをダウンロードする
function download(url, filename)
{
    const arg = { url: url,
                  name: filename,
                  saveAs: false,
                  onerror: onError,
                  onload: onLoad,
                  ontimeout: onTimeout
                };
    GM_download(arg);
}
 
// 作品のダウンロードに成功したら次の作品に進む
function onLoad()
{
    console.log("Download Complete!: " + imageData[currentDownloadIndex].paintingTitle + "(" + currentDownloadIndex + ")");
    console.log("--------------------");
 
    currentDownloadIndex++;
    currentRetry = 0;
    setTimeout(startDownload, interval);
}
 
// ダウンロードに失敗したときに再試行する
function retry()
{
    currentRetry++;
    // 規定回数ダウンロードを繰り返す
    if(currentRetry <= maxRetry)
    {
        console.log("Retry! " + currentRetry);
        setTimeout(startDownload, retryInterval);
    }
    // それでもダメだった場合はあとで見つけやすいように登録しておく
    else
    {
        const index = currentDownloadIndex;
        const title = imageData[currentDownloadIndex].paintingTitle;
        const year = imageData[currentDownloadIndex].year;
        failedData.push({ index: index, title: title, year: year });
 
        console.log("--------------------");
 
        // 続行
        currentDownloadIndex++;
        currentRetry = 0;
        setTimeout(startDownload, interval);
    }
}
 
function onError(err)
{
    console.log("*** Error! *** " + imageData[currentDownloadIndex].paintingTitle + "(" + currentDownloadIndex + ") was not downloaded! Reason: " + err.error);
    retry();
}
 
function onTimeout()
{
    console.log("*** Timeout! ***" + imageData[currentDownloadIndex].paintingTitle + "(" + currentDownloadIndex + ") was not downloaded!");
    retry();
}