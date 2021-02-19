var s = document.createElement('script');
s.src = chrome.runtime.getURL('script.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

var s = document.createElement('script2');
s.src = chrome.runtime.getURL('jquery.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);


