$.fn.data = function (b, c) {
    var d = $(this).dataset();
    if (!b)
        return d;
    if ("undefined" == typeof c) {
        var e = d[b]
            , f = this[0].__eleData;
        return f && b in f ? f[b] : e
    }
    for (var g = 0; g < this.length; g++) {
        var h = this[g];
        if (b in d) {
            try {
                delete h.dataset[b]
            }
            catch (ex) {
                h.dataset[b] = null;
            }
        }
        h.__eleData || (h.__eleData = {}),
            h.__eleData[b] = c
    }
    return this
}
//日期格式化
Date.prototype.format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
    return fmt;
}

export default {}
