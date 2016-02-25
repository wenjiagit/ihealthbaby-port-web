/*========================================================
 * 一些基础工具封装
 * =======================================================*/
$.extend({
    device: (function () {
        var device = {};
        var ua = navigator.userAgent;
        var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);

        device.ios = device.android = device.iphone = device.ipad = device.androidChrome = false;

        // Android
        if (android) {
            device.os = 'android';
            device.osVersion = android[2];
            device.android = true;
            device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
        }
        if (ipad || iphone || ipod) {
            device.os = 'ios';
            device.ios = true;
        }
        // iOS
        if (iphone && !ipod) {
            device.osVersion = iphone[2].replace(/_/g, '.');
            device.iphone = true;
        }
        if (ipad) {
            device.osVersion = ipad[2].replace(/_/g, '.');
            device.ipad = true;
        }
        if (ipod) {
            device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
            device.iphone = true;
        }
        // iOS 8+ changed UA
        if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
            if (device.osVersion.split('.')[0] === '10') {
                device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
            }
        }

        // Webview
        device.webView = (iphone || ipad || ipod) && ua.match(/.*AppleWebKit(?!.*Safari)/i);

        // Minimal UI
        if (device.os && device.os === 'ios') {
            var osVersionArr = device.osVersion.split('.');
            device.minimalUi = !device.webView &&
                (ipod || iphone) &&
                (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7) &&
                $('meta[name="viewport"]').length > 0 && $('meta[name="viewport"]').attr('content').indexOf('minimal-ui') >= 0;
        }

        // Check for status bar and fullscreen app mode
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        device.statusBar = false;
        if (device.webView && (windowWidth * windowHeight === screen.width * screen.height)) {
            device.statusBar = true;
        } else {
            device.statusBar = false;
        }

        // Classes
        var classNames = [];

        // Pixel Ratio
        device.pixelRatio = window.devicePixelRatio || 1;
        classNames.push('pixel-ratio-' + Math.floor(device.pixelRatio));
        if (device.pixelRatio >= 2) {
            classNames.push('retina');
        }

        // OS classes
        if (device.os) {
            classNames.push(device.os, device.os + '-' + device.osVersion.split('.')[0], device.os + '-' + device.osVersion.replace(/\./g, '-'));
            if (device.os === 'ios') {
                var major = parseInt(device.osVersion.split('.')[0], 10);
                for (var i = major - 1; i >= 6; i--) {
                    classNames.push('ios-gt-' + i);
                }
            }

        }
        // Status bar classes
        if (device.statusBar) {
            classNames.push('with-statusbar-overlay');
        } else {
            $('html').removeClass('with-statusbar-overlay');
        }

        // Add html classes
        if (classNames.length > 0) $('html').addClass(classNames.join(' '));

        // Export object
        return device;
    })()
});

$.extend({
    support: {
        touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch)
    }
});
$.extend({
    touchEvents: {
        start: $.support.touch ? 'touchstart' : 'mousedown',
        move: $.support.touch ? 'touchmove' : 'mousemove',
        end: $.support.touch ? 'touchend' : 'mouseup'
    }
});
$.extend({
    compareVersion: function (a, b) {
        if (a === b) return 0;
        var as = a.split('.');
        var bs = b.split('.');
        for (var i = 0; i < as.length; i++) {
            var x = parseInt(as[i]);
            if (!bs[i]) return 1;
            var y = parseInt(bs[i]);
            if (x < y) return -1;
            if (x > y) return 1;
        }
        return 1;
    }
});

$.fn.transform = function (transform) {
    for (var i = 0; i < this.length; i++) {
        var elStyle = this[i].style;
        elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
    }
    return this;
};
$.fn.transition = function (duration) {
    if (typeof duration !== 'string') {
        duration = duration + 'ms';
    }
    for (var i = 0; i < this.length; i++) {
        var elStyle = this[i].style;
        elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
    }
    return this;
};
$.fn.transitionEnd = function (callback) {
    var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
        i, j, dom = this;

    function fireCallBack(e) {
        /*jshint validthis:true */
        if (e.target !== this) return;
        callback.call(this, e);
        for (i = 0; i < events.length; i++) {
            dom.off(events[i], fireCallBack);
        }
    }

    if (callback) {
        for (i = 0; i < events.length; i++) {
            dom.on(events[i], fireCallBack);
        }
    }
    return this;
};
$.fn.animationEnd = function (callback) {
    var events = ['webkitAnimationEnd', 'OAnimationEnd', 'MSAnimationEnd', 'animationend'],
        i, j, dom = this;

    function fireCallBack(e) {
        callback(e);
        for (i = 0; i < events.length; i++) {
            dom.off(events[i], fireCallBack);
        }
    }

    if (callback) {
        for (i = 0; i < events.length; i++) {
            dom.on(events[i], fireCallBack);
        }
    }
    return this;
};


/**
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
 * See README.md for details.
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */
function LRUCache(limit) {
    // Current size of the cache. (Read-only).
    this.size = 0;
    // Maximum number of items this cache can hold.
    this.limit = limit;
    this._keymap = {};
}

/**
 * Put <value> into the cache associated with <key>. Returns the entry which was
 * removed to make room for the new entry. Otherwise undefined is returned
 * (i.e. if there was enough room already).
 */
LRUCache.prototype.put = function (key, value) {
    var entry = {key: key, value: value};
    // Note: No protection agains replacing, and thus orphan entries. By design.
    this._keymap[key] = entry;
    if (this.tail) {
        // link previous tail to the new tail (entry)
        this.tail.newer = entry;
        entry.older = this.tail;
    } else {
        // we're first in -- yay
        this.head = entry;
    }
    // add new entry to the end of the linked list -- it's now the freshest entry.
    this.tail = entry;
    if (this.size === this.limit) {
        // we hit the limit -- remove the head
        return this.shift();
    } else {
        // increase the size counter
        this.size++;
    }
};

/**
 * Purge the least recently used (oldest) entry from the cache. Returns the
 * removed entry or undefined if the cache was empty.
 *
 * If you need to perform any form of finalization of purged items, this is a
 * good place to do it. Simply override/replace this function:
 *
 *   var c = new LRUCache(123);
 *   c.shift = function() {
 *     var entry = LRUCache.prototype.shift.call(this);
 *     doSomethingWith(entry);
 *     return entry;
 *   }
 */
LRUCache.prototype.shift = function () {
    // todo: handle special case when limit == 1
    var entry = this.head;
    if (entry) {
        if (this.head.newer) {
            this.head = this.head.newer;
            this.head.older = undefined;
        } else {
            this.head = undefined;
        }
        // Remove last strong reference to <entry> and remove links from the purged
        // entry being returned:
        entry.newer = entry.older = undefined;
        // delete is slow, but we need to do this to avoid uncontrollable growth:
        delete this._keymap[entry.key];
    }
    return entry;
};

/**
 * Get and register recent use of <key>. Returns the value associated with <key>
 * or undefined if not in cache.
 */
LRUCache.prototype.get = function (key, returnEntry) {
    // First, find our cache entry
    var entry = this._keymap[key];
    if (entry === undefined) return; // Not cached. Sorry.
    // As <key> was found in the cache, register it as being requested recently
    if (entry === this.tail) {
        // Already the most recenlty used entry, so no need to update the list
        return returnEntry ? entry : entry.value;
    }
    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry.newer) {
        if (entry === this.head)
            this.head = entry.newer;
        entry.newer.older = entry.older; // C <-- E.
    }
    if (entry.older)
        entry.older.newer = entry.newer; // C. --> E
    entry.newer = undefined; // D --x
    entry.older = this.tail; // D. --> E
    if (this.tail)
        this.tail.newer = entry; // E. <-- D
    this.tail = entry;
    return returnEntry ? entry : entry.value;
};

// ----------------------------------------------------------------------------
// Following code is optional and can be removed without breaking the core
// functionality.

/**
 * Check if <key> is in the cache without registering recent use. Feasible if
 * you do not want to chage the state of the cache, but only "peek" at it.
 * Returns the entry associated with <key> if found, or undefined if not found.
 */
LRUCache.prototype.find = function (key) {
    return this._keymap[key];
};

/**
 * Update the value of entry with <key>. Returns the old value, or undefined if
 * entry was not in the cache.
 */
LRUCache.prototype.set = function (key, value) {
    var oldvalue, entry = this.get(key, true);
    if (entry) {
        oldvalue = entry.value;
        entry.value = value;
    } else {
        oldvalue = this.put(key, value);
        if (oldvalue) oldvalue = oldvalue.value;
    }
    return oldvalue;
};

/**
 * Remove entry <key> from cache and return its value. Returns undefined if not
 * found.
 */
LRUCache.prototype.remove = function (key) {
    var entry = this._keymap[key];
    if (!entry) return;
    delete this._keymap[entry.key]; // need to do delete unfortunately
    if (entry.newer && entry.older) {
        // relink the older entry with the newer entry
        entry.older.newer = entry.newer;
        entry.newer.older = entry.older;
    } else if (entry.newer) {
        // remove the link to us
        entry.newer.older = undefined;
        // link the newer entry to head
        this.head = entry.newer;
    } else if (entry.older) {
        // remove the link to us
        entry.older.newer = undefined;
        // link the newer entry to head
        this.tail = entry.older;
    } else {// if(entry.older === undefined && entry.newer === undefined) {
        this.head = this.tail = undefined;
    }

    this.size--;
    return entry.value;
};

/** Removes all entries */
LRUCache.prototype.removeAll = function () {
    // This should be safe, as we never expose strong refrences to the outside
    this.head = this.tail = undefined;
    this.size = 0;
    this._keymap = {};
};

/**
 * Return an array containing all keys of entries stored in the cache object, in
 * arbitrary order.
 */
if (typeof Object.keys === 'function') {
    LRUCache.prototype.keys = function () {
        return Object.keys(this._keymap);
    };
} else {
    LRUCache.prototype.keys = function () {
        var keys = [];
        for (var k in this._keymap) keys.push(k);
        return keys;
    };
}

/**
 * Call `fun` for each entry. Starting with the newest entry if `desc` is a true
 * value, otherwise starts with the oldest (head) enrty and moves towards the
 * tail.
 *
 * `fun` is called with 3 arguments in the context `context`:
 *   `fun.call(context, Object key, Object value, LRUCache self)`
 */
LRUCache.prototype.forEach = function (fun, context, desc) {
    var entry;
    if (context === true) {
        desc = true;
        context = undefined;
    }
    else if (typeof context !== 'object') context = this;
    if (desc) {
        entry = this.tail;
        while (entry) {
            fun.call(context, entry.key, entry.value, this);
            entry = entry.older;
        }
    } else {
        entry = this.head;
        while (entry) {
            fun.call(context, entry.key, entry.value, this);
            entry = entry.newer;
        }
    }
};

/** Returns a JSON (array) representation */
LRUCache.prototype.toJSON = function () {
    var s = [], entry = this.head;
    while (entry) {
        s.push({key: entry.key.toJSON(), value: entry.value.toJSON()});
        entry = entry.newer;
    }
    return s;
};

/** Returns a String representation */
LRUCache.prototype.toString = function () {
    var s = '', entry = this.head;
    while (entry) {
        s += String(entry.key) + ':' + entry.value;
        entry = entry.newer;
        if (entry)
            s += ' < ';
    }
    return s;
};

// Export ourselves
if (typeof this === 'object') this.LRUCache = LRUCache;


var lruCache = new LRUCache(30);//全局的存储session级别的。值存储30条记录

//TODO 区别用户? 调用者自己区分把.
$.extend({//session 级别存储
    sessionStorage: (function () {
        return {
            storage: function (key, value) {
                if (value == undefined) {//get
                    return lruCache.get(key);
                } else {//set
                    lruCache.set(key, value);
                }
            },
            clear: function (key) {
                return lruCache.remove(key);
            },
            clearAll: function () {
                lruCache.removeAll();
            }

        }
    })(),
    localStorage: (function () {
        var storageObj = window.localStorage;
        return {
            storage: function (key, value) {
                if (value == undefined) {//get
                    try {
                        var data = storageObj[key] ? JSON.parse(storageObj[key]) : {};
                        return data
                    } catch (oException) {
                        console.log("storage error: " + oException.name);
                        return null;
                    }

                } else {//set
                    try {
                        storageObj[key] = JSON.stringify(value);
                    } catch (oException) {
                        if (oException.name == 'QuotaExceededError') {
                            console.log("storage error: QuotaExceededError");
                        }
                    }

                }
            },
            clear: function (key) {
                var value = storageObj[key] ? JSON.parse(storageObj[key]) : {};
                storageObj[key] = null;
                return value;
            },
            clearAll: function () {
                //TODO 实现这个方法
                $.alert('没实现');
            }
        }
    })()

});





/*========================================================
 * 发布订阅模式
 * =======================================================*/
;
(function ($, window, document, undefined) {
    var pubsub = {};
    (function ($) {
        $.topics = {};
        $.publish = function (topic, args) {
            /*
             发布或广播事件
             topic：事件名称
             args：回调函数参数
             */
            if (!$.topics[topic])
                return false;
            for (p in $.topics[topic]) {
                var func = $.topics[topic][p];
                func(args)
            }
            return this;
        };
        $.subscribe = function (topic, name, func) {
            /*
             通过事件名称、订阅者名称、回调函数订阅事件
             topic：事件名
             name: 订阅者名 可选 如果没指定那么，那么不能单独取消订阅，只能统一取消订阅。
             func: 订阅事件（发布时触发）
             同一个事件，不同的订阅者可以单独取消自己的订阅
             */
            if (arguments.length == 2) {
                //未指定name，使用时间戳，指定一个
                func = name;
                name = new Date().getTime();
            }
            if (!$.topics[topic])
                $.topics[topic] = {};
            // 对应topic下加入回调函数
            $.topics[topic][name] = func;
            return this;
        };
        $.unsubscribe = function (topic, name) {
            /*
             解绑取消订阅事件
             topic：事件名
             name: 订阅者名 可选 如果没指定那么，那么不能单独取消订阅，只能统一取消订阅。
             */
            if (!$.topics[topic])
                return false;
            if (!name) {
                //解绑所有 topic 事件
                delete($.topics[topic]);
            } else if ($.topics[topic][name]) {
                //解绑 topic 事件下的指定 name 订阅者
                delete($.topics[topic][name]);
            }
            return this;
        }
    })(pubsub);


    $.extend({
        publish: pubsub.publish,
        subscribe: pubsub.subscribe,
        unsubscribe: pubsub.unsubscribe
    });

// 注册事件 订阅
//    pubsub.subscribe("confirm", "confirm1", function (data) {
//        alert("this is the confirm1");
//    });
//    pubsub.subscribe("alert", "alert1", function (data) {
//        alert("this is the alert1 " + data);
//    });
//    pubsub.subscribe("alert", 'alert2', function (data) {
//        alert("this is the alert2 " + data);
//    });
//    pubsub.subscribe("alert", 'alert3', function (data) {
//        alert("this is the alert3 " + data);
//    });
//    //订阅事件，但是不指定订阅者名称
//    pubsub.subscribe("alert", function (data) {
//        alert("this is the alert no name " + data);
//    });
//    //发布消息
//    pubsub.publish("alert", "adsfadsf");
//    //取消订阅
//    pubsub.unsubscribe("alert", "alert3")
//    //发布消息，此时alert3这个订阅者就接收不到消息了。
//    pubsub.publish("alert", "adsfadsf");
//    //所有的订阅者全部取消订阅
//    pubsub.unsubscribe("alert");
//    //发布消息，这是alert3这个订阅者就接收不到消息了。
//    pubsub.publish("alert", "adsfadsf");
})(jQuery, window, document);



/*========================================================
 * 初始化div滚动条,判断是否使用iscroll,提供几个操作滚动条的方法
 * =======================================================*/
;
(function ($, window, document, undefined) {
    /*
     * 判断是否使用iscroll
     * */
    $.fn.initScroll = function () {
        //（怎么用功能检测，而不是用版本检测。）
        var useJSScroller = (($.device.android && $.compareVersion('4.4.0', $.device.osVersion) > -1) || ($.device.ios && $.compareVersion('6.0.0', $.device.osVersion) > -1));
        //useJSScroller = true;
        var container = this;
        if (useJSScroller) {
            /* 
             * TODO 动态加载优化
             * 使用ajax 同步加载
             *
             * */
            if (window.IScroll==undefined) {
                $.ajax({
                    url: "/s/js/iscroll-probe.min.js",
                    dataType: 'script',
                    type: 'GET',
                    async: false,
                    success: function () {
                        _initIscroll();
                    }
                });
            }else{
                _initIscroll()
            }
            function _initIscroll() {
                container.css('height', 'auto');
                //反复init 会出现多个滚动条
                if ($('.iScrollVerticalScrollbar').length > 0) {
                    $('.iScrollVerticalScrollbar').remove();
                }
                //            var oriiscroll = container.data('iscroll');
                //            if(oriiscroll){
                //                alert('destroy');
                //                oriiscroll.destroy();
                //            }
                var iscroll = new IScroll(container.parent()[0], {
                    scrollX: false,
                    mouseWheel: true,
                    freeScroll: true,
                    scrollbars: true, //是否显示滚动条
                    probeType: 3

                });
                container.data('iscroll', iscroll);
            }

        }
        return this;
    };
    /*
     * 设置滚动条位置
     * */
    $.fn.scrollTo = function (scrollTop, time) {
        time = time == undefined ? 0 : time;
        var ele = this;
        var iscroll = ele.data('iscroll');
        if (iscroll) {
            iscroll.scrollTo(0, -scrollTop, time, false);
        } else {
            ele.animate({scrollTop: scrollTop}, time);
        }
        return ele;
    };
    $.fn.getScrollTop = function () {
        var ele = this;
        var iscroll = ele.data('iscroll');
        if (iscroll) {
            return -iscroll.y;
        } else {
            return ele.scrollTop();
        }
    }
})(jQuery, window, document);



/*========================================================
 * 无限加载
 * =======================================================*/
;
(function ($, window, document, undefined) {
    function handleInfiniteScroll() {
        /*jshint validthis:true */
        var inf = $(this);
        var scrollTop = inf[0].scrollTop;
        var scrollHeight = inf[0].scrollHeight;
        var height = inf[0].offsetHeight;
        var distance = inf[0].getAttribute('data-distance');
        var virtualListContainer = inf.find('.virtual-list');
        var virtualList;
        if (!distance) distance = 50;
        if (typeof distance === 'string' && distance.indexOf('%') >= 0) {
            distance = parseInt(distance, 10) / 100 * height;
        }
        if (distance > height) distance = height;
        if (scrollTop + height >= scrollHeight - distance) {
            if (virtualListContainer.length > 0) {
                virtualList = virtualListContainer[0].f7VirtualList;
                if (virtualList && !virtualList.reachEnd) return;
            }
            if (inf.hasClass('infinitting')) {
                return;
            }
            inf.addClass('infinitting');
            inf.trigger('infinite', {
                done: function () {
                    inf.infiniteScrollDone();
                }
            });
        }

    }

    function handleIScrollInfiniteScroll(container, iscroll) {

        var offsetY = iscroll.y;
        var maxScrollY = iscroll.maxScrollY;
        var inf = container;
        var distance = inf[0].getAttribute('data-distance');
        var virtualListContainer = inf.find('.virtual-list');
        var virtualList;
        if (!distance) distance = 50;
        if (typeof distance === 'string') {
            distance = parseInt(distance);
        }
        if ((-maxScrollY + offsetY) < distance) {
            if (inf.hasClass('infinitting')) {
                return;
            }
            inf.addClass('infinitting');
            inf.trigger('infinite', {
                done: function () {
                    inf.infiniteScrollDone();
                }
            });
        }
    }

    $.fn.initInfiniteScroll = function () {
        var eventsTarget = this;
        if (!eventsTarget.hasClass('infinite-scroll-content')) {
            eventsTarget = eventsTarget.find('.infinite-scroll-content');
        }
        if (!eventsTarget || eventsTarget.length === 0) return;

        var $layer = eventsTarget.find('.infinite-scroll-layer');
        if ($layer.length <= 0) {
            eventsTarget.append('<div class="infinite-scroll-layer">加载中...</div>')
        } else {
            $layer.show();
        }

        var iscroll = eventsTarget.data('iscroll');
        var infiniteScrolldetached = eventsTarget.data('infiniteScrolldetached');
        if (iscroll) {
            if (!infiniteScrolldetached) {
                iscroll.on('scroll', function () {
                    var infiniteScrolldetached = eventsTarget.data('infiniteScrolldetached');
                    if (infiniteScrolldetached) {
                        return;
                    }
                    handleIScrollInfiniteScroll(eventsTarget, this);
                });
            }
            eventsTarget.data('infiniteScrolldetached', false);
            iscroll.refresh();
        } else {
            eventsTarget.on('scroll', handleInfiniteScroll);
        }

        return eventsTarget;

    };


    $.fn.infiniteScrollDone = function () {
        var eventsTarget = this;
        var iscroll = eventsTarget.data('iscroll');
        if (iscroll)iscroll.refresh();
        eventsTarget.removeClass('infinitting');
    };
    $.fn.detachInfiniteScroll = function () {
        var eventsTarget = this;
        eventsTarget.removeClass('infinitting');
        eventsTarget.data('infiniteScrolldetached', true);
        var $layer = eventsTarget.find('.infinite-scroll-layer');
        if (eventsTarget.find('.infinite-scroll-layer').length > 0) {
            $layer.hide();
        }

        var iscroll = eventsTarget.data('iscroll');
        if (iscroll) {
            iscroll.refresh();
        } else {
            eventsTarget.off('scroll', handleInfiniteScroll);
        }

        return eventsTarget;
    };


})(jQuery, window, document);

/*========================================================
 * 下拉刷新
 * =======================================================*/
;
(function ($, window, document, undefined) {
    $.fn.initPullToRefresh = function () {

        var eventsTarget = this;
        if (!eventsTarget.hasClass('pull-to-refresh-content')) {
            eventsTarget = eventsTarget.find('.pull-to-refresh-content');
        }
        if (!eventsTarget || eventsTarget.length === 0) return;

        var touchId, isTouched, isMoved, touchesStart = {},
            isScrolling, touchesDiff, touchStartTime, container, refresh = false,
            useTranslate = false,
            startTranslate = 0,
            translate, scrollTop, wasScrolled, layer, triggerDistance, dynamicTriggerDistance;
        var page = eventsTarget.hasClass('page') ? eventsTarget : eventsTarget.parents('.page');
        var hasNavbar = false;
        if (page.find('.navbar').length > 0 || page.parents('.navbar-fixed, .navbar-through').length > 0 || page.hasClass('navbar-fixed') || page.hasClass('navbar-through')) hasNavbar = true;
        if (page.hasClass('no-navbar')) hasNavbar = false;
        if (!hasNavbar) eventsTarget.addClass('pull-to-refresh-no-navbar');

        container = eventsTarget;

        // Define trigger distance
        if (container.attr('data-ptr-distance')) {
            dynamicTriggerDistance = true;
        } else {
            triggerDistance = 44;
        }

        function handleTouchStart(e) {
            e = e.originalEvent
            if (isTouched) {
                if ($.device.os === 'android') {
                    if ('targetTouches' in e && e.targetTouches.length > 1) return;
                } else return;
            }

            isMoved = false;
            isTouched = true;
            isScrolling = undefined;
            wasScrolled = undefined;
            if (e.type === 'touchstart') touchId = e.targetTouches[0].identifier;
            touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
            touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
            touchStartTime = (new Date()).getTime();
            /*jshint validthis:true */
            container = $(this);
        }

        function handleTouchMove(e) {
            e = e.originalEvent
            if (!isTouched) return;
            var pageX, pageY, touch;
            if (e.type === 'touchmove') {
                if (touchId && e.touches) {
                    for (var i = 0; i < e.touches.length; i++) {
                        if (e.touches[i].identifier === touchId) {
                            touch = e.touches[i];
                        }
                    }
                }
                if (!touch) touch = e.targetTouches[0];
                pageX = touch.pageX;
                pageY = touch.pageY;
            } else {
                pageX = e.pageX;
                pageY = e.pageY;
            }
            if (!pageX || !pageY) return;


            if (typeof isScrolling === 'undefined') {
                isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
            }
            if (!isScrolling) {
                isTouched = false;
                return;
            }

            scrollTop = container[0].scrollTop;
            //iscroll
            var iscroll = container.data('iscroll');
            if (iscroll) {
                scrollTop = -iscroll.y
                scrollTop = scrollTop <= 0 ? 0 : scrollTop;
            }
            //end of iscroll

            if (typeof wasScrolled === 'undefined' && scrollTop !== 0) wasScrolled = true;

            if (!isMoved) {
                /*jshint validthis:true */
                container.removeClass('transitioning');
                if (scrollTop > container[0].offsetHeight) {
                    isTouched = false;
                    return;
                }
                if (dynamicTriggerDistance) {
                    triggerDistance = container.attr('data-ptr-distance');
                    if (triggerDistance.indexOf('%') >= 0) triggerDistance = container[0].offsetHeight * parseInt(triggerDistance, 10) / 100;
                }
                startTranslate = container.hasClass('refreshing') ? triggerDistance : 0;
                if (container[0].scrollHeight === container[0].offsetHeight || $.device.os !== 'ios') {
                    useTranslate = true;
                } else {
                    useTranslate = false;
                }
            }
            isMoved = true;
            touchesDiff = pageY - touchesStart.y;

            if (touchesDiff > 0 && scrollTop <= 0 || scrollTop < 0) {
                // iOS 8 fix
                if ($.device.os === 'ios' && parseInt($.device.osVersion.split('.')[0], 10) > 7 && scrollTop === 0 && !wasScrolled) useTranslate = true;

                if (useTranslate) {
                    e.preventDefault();
                    translate = (Math.pow(touchesDiff, 0.85) + startTranslate);
                    container.transform('translate3d(0,' + translate + 'px,0)');
                } else {
                }
                if ((useTranslate && Math.pow(touchesDiff, 0.85) > triggerDistance) || (!useTranslate && touchesDiff >= triggerDistance * 2)) {
                    refresh = true;
                    container.addClass('pull-up').removeClass('pull-down');
                } else {
                    refresh = false;
                    container.removeClass('pull-up').addClass('pull-down');
                }
            } else {

                container.removeClass('pull-up pull-down');
                refresh = false;
                return;
            }
        }

        function handleTouchEnd(e) {
            e = e.originalEvent
            if (e.type === 'touchend' && e.changedTouches && e.changedTouches.length > 0 && touchId) {
                if (e.changedTouches[0].identifier !== touchId) return;
            }
            if (!isTouched || !isMoved) {
                isTouched = false;
                isMoved = false;
                return;
            }
            if (translate) {
                container.addClass('transitioning');
                translate = 0;
            }
            container.transform('');
            if (refresh) {
                container.addClass('refreshing');
                container.trigger('refresh', {
                    done: function () {
                        container.pullToRefreshDone();
                    }
                });
            } else {
                container.removeClass('pull-down');
            }
            isTouched = false;
            isMoved = false;
        }

        // Attach Events
        eventsTarget.on($.touchEvents.start, handleTouchStart);
        eventsTarget.on($.touchEvents.move, handleTouchMove);
        eventsTarget.on($.touchEvents.end, handleTouchEnd);

        // Detach Events on page remove
        if (page.length === 0) return;

        function destroyPullToRefresh() {
            eventsTarget.off($.touchEvents.start, handleTouchStart);
            eventsTarget.off($.touchEvents.move, handleTouchMove);
            eventsTarget.off($.touchEvents.end, handleTouchEnd);

        }

        eventsTarget[0].f7DestroyPullToRefresh = destroyPullToRefresh;

        function detachEvents() {
            destroyPullToRefresh();
            page.off('pageBeforeRemove', detachEvents);
        }

        page.on('pageBeforeRemove', detachEvents);
        return this;
    };
    $.fn.pullToRefreshDone = function () {
        var container = this;
        if (container.length === 0) container = $('.pull-to-refresh-content.refreshing');
        container.removeClass('refreshing').addClass('transitioning');
        container.transitionEnd(function () {
            container.removeClass('transitioning pull-up pull-down');
        });
        var iscroll = container.data('iscroll');
        if (iscroll) iscroll.refresh();
        return this;
    };

    $.fn.pullToRefreshTrigger = function () {
        var container = this;
        if (container.length === 0) container = $('.pull-to-refresh-content');
        if (container.hasClass('refreshing')) return this;
        container.addClass('transitioning refreshing');
        container.trigger('refresh', {
            done: function () {
                container.pullToRefreshDone(container);
            }
        });
        return this;
    };

    $.fn.destroyPullToRefresh = function () {
        var pageContainer = this;
        var pullToRefreshContent = pageContainer.hasClass('pull-to-refresh-content') ? pageContainer : pageContainer.find('.pull-to-refresh-content');
        if (pullToRefreshContent.length === 0) return this;
        if (pullToRefreshContent[0].f7DestroyPullToRefresh) pullToRefreshContent[0].f7DestroyPullToRefresh();
        return this;
    };

})(jQuery, window, document);

/*========================================================
 * ajax 或缓存 加载页面
 * =======================================================*/
;
(function ($, window, document, undefined) {
    var pageContent = '.page-content';
    //在webkit中，无论是刷新还是访问一个新网页都会触发popstate
    //延迟绑定？？ 有点不好控制
    /*
     * Necessary hack because WebKit fires a popstate event on document load
     * https://code.google.com/p/chromium/issues/detail?id=63040
     * https://bugs.webkit.org/process_bug.cgi
     */
    window.addEventListener('load', function () {
        //页面第一次加载的时候要保存一下页面.否则第一个页面无法缓存
        $.savePage(getCurrentUrl());
        setTimeout(function () {
            window.addEventListener('popstate', function (event) {
                var currentState = event.state;
                var targetUrl = getCurrentUrl();
                loadPage({
                    fromHistory: true,
                    targetUrl: targetUrl,
                    pushState: false,
                    replaceState: false
                });
            });
        }, 0);
    });


    function loadPage(options) {
        var targetUrl = options.targetUrl;
        var pageOptions = $.sessionStorage.storage(targetUrl);
        if (pageOptions) {
            loadPageFromCache(options);
        } else {
            loadPageFromServer(options);
        }
    }

    function loadPageFromCache(options) {
        var targetUrl = options.targetUrl;
        var pageOptions = $.sessionStorage.storage(targetUrl);
        console.log('page from local,targetUrl:' + targetUrl);
        options.pageOptions = pageOptions;
        switchPage(options);
    }

    var _loadPageAjax = null;

    function loadPageFromServer(options) {
        var targetUrl = options.targetUrl;
        if (_loadPageAjax) {//打断ajax请求
            _loadPageAjax.abort();
        }
        var data = {};
        _loadPageAjax = $.ajax({
            method: 'GET',
            dataType: 'html',
            data: data,
            url: targetUrl,
            beforeSend: function (XMLHttpRequest) {
                $.showIndicator();
            },
            success: function (data, textStatus) {
                console.log('page from server,targetUrl:' + targetUrl);
                options.pageOptions = {
                    pageData: data,
                    scrollTop: 0
                };
                switchPage(options);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if (textStatus == "abort") {//请求被中断，直接返回，不给提示（多次点击执行了多个请求会出现这个错误）
                    return;
                }
                $.alert('loadPageFromServer: error');
            },
            complete: function (XMLHttpRequest, textStatus) {
                $.hideIndicator();
                //alert(textStatus+':'+XMLHttpRequest.status);
                // 加载完毕需要重置
                if (textStatus == 'timeout') {//超时,status还有success,error等值的情况
                    this.abort();
                    $.alert('loadPageFromServer: timeout');
                    return false;
                }
                //重定向
                var location_url = XMLHttpRequest.getResponseHeader('location');
                if (XMLHttpRequest.status == 302 || XMLHttpRequest.status == 301 || location_url) {
                    location.href = location_url;
                    return false;
                }
            }
        });
    }

    /*
     * 切换页面,切换动画可以在这里做
     * */

    var _preUrl = getCurrentUrl();

    function switchPage(options) {
        var fromHistory = options.fromHistory == undefined ? false : options.fromHistory;
        var pageContent = options.pageContent == undefined ? '.page-content' : options.pageContent;
        var $pageContent = $(pageContent);
        var targetUrl = options.targetUrl;
        var pageData = options.pageOptions.pageData;
        var scrollTop = options.pageOptions.scrollTop;
        scrollTop = scrollTop ? scrollTop : 0;
        var pushState = options.pushState == undefined ? true : options.pushState;
        var replaceState = options.replaceState == undefined ? true : options.replaceState;
        $pageContent.pullToRefreshDone();
        $pageContent.infiniteScrollDone();

        if (pushState) {
            _preUrl = getCurrentUrl();
            history.pushState({title: '聚萝卜', pageUrl: targetUrl}, '聚萝卜', targetUrl);
        } else if (replaceState) {
            _preUrl = getCurrentUrl();
            history.replaceState({title: '聚萝卜', pageUrl: targetUrl}, '聚萝卜', targetUrl);
        }
        //缓存页面
        savePage(_preUrl);
        _preUrl = targetUrl;
        //移除当前页面的js
        $('.script-content').remove();

        var $viewMain = $('.view.view-main');
        var $pages = $viewMain.find('.pages');
        var $oldPage = $viewMain.find('.pages>.page');
        var $newPage = $(pageData).find('.page');

        var $oldNavbar = $('.view.view-main>.navbar');
        var $newNavbar = $('<div>' + pageData + '</div>').find('>.navbar');
        var $oldToolbar = $('.view.view-main>.toolbar');
        var $newToolbar = $('<div>' + pageData + '</div>').find('>.toolbar');
        var $newScriptContent = $('<div>' + pageData + '</div>').find('>.script-content');
        if (fromHistory) {//从又到左的动画
            pageAnimate('left-to-center');
        } else {//从左到右的动画
            pageAnimate('right-to-center');
        }

        function pageAnimate(direction) {
            var oldPageDirection = 'center-to-left';
            if (direction == 'left-to-center') {
                oldPageDirection = 'center-to-right'
            }

            $oldPage.removeClass('page-on-center')
                .addClass('page-from-' + oldPageDirection)
                .animationEnd(function () {
                    $oldPage.trigger('beforeRemove');
                    $oldPage.remove();
                });

            if (direction == 'left-to-center') {
                $pages.prepend($newPage);
            } else {
                $pages.append($newPage);
            }

            $newPage.trigger('pageBeforeAnimation');
            $newPage.removeClass('page-on-center')
                .addClass('page-from-' + direction)
                .animationEnd(function () {
                    $newPage.removeClass('page-from-' + direction)
                        .addClass('page-on-center');
                    $newPage.trigger('pageAfterAnimation');
                });
            //头部处理
            if ($oldNavbar.length > 0) {
                var $oldNavbarInner = $oldNavbar.find('.navbar-inner');
                $oldNavbarInner.removeClass('navbar-on-center')
                    .addClass('navbar-from-' + oldPageDirection)
                    .animationEnd(function () {
                        $oldNavbar.remove();
                    });
            }
            if ($newNavbar.length > 0) {
                if (direction == 'left-to-center') {
                    $viewMain.prepend($newNavbar);
                } else {
                    $viewMain.append($newNavbar);
                }
                if (!$pages.hasClass('navbar-through')) {
                    $pages.addClass('navbar-through');
                }
                var $newNavbarInner = $newNavbar.find('.navbar-inner');
                $newNavbarInner.removeClass('navbar-on-center')
                    .addClass('navbar-from-' + direction)
                    .animationEnd(function () {
                        $newNavbarInner.removeClass('navbar-from-' + direction)
                            .addClass('navbar-on-center');
                    });
            } else if ($pages.hasClass('navbar-through')) {
                $pages.removeClass('navbar-through');
            }

            //底部处理
            $oldToolbar.remove();
            if ($newToolbar.length > 0) {
                $viewMain.prepend($newToolbar);
                if (!$pages.hasClass('toolbar-through')) {
                    $pages.addClass('toolbar-through');
                }
            } else if ($pages.hasClass('toolbar-through')) {
                $pages.removeClass('toolbar-through');
            }
            //js处理
            $viewMain.prepend($newScriptContent);
        }


        var $newPageContent = $newPage.find(pageContent);//页面改变了需要重新赋值
        var iscroll = $newPageContent.data('iscroll');
        if (iscroll) {
            iscroll.refresh();
        }
        $newPageContent.scrollTo(scrollTop);
    }

    function savePage(url) {
        var $mainView = $('.view.view-main');
        var viewsHtml = $mainView.html();
        var scriptContent = '';
        if ($mainView.find('.script-content').length <= 0) {
            scriptContent = $('.script-content').prop("outerHTML");
        }
        var scrollTop = $(pageContent).getScrollTop();
        var pageData = viewsHtml + scriptContent;
        var pageOptions = {
            scrollTop: scrollTop,
            pageData: pageData
        };
        $.sessionStorage.storage(url, pageOptions)
    }

    function getCurrentUrl() {
        var currentUrl = window.location.href;
        currentUrl = currentUrl.substr(currentUrl.indexOf(window.location.host) + window.location.host.length);
        return currentUrl;
    }

    $.extend({
        loadPage: loadPage,
        loadPageFromCache: loadPageFromCache,
        loadPageFromServer: loadPageFromServer,
        savePage: savePage,
        getCurrentUrl: getCurrentUrl

    });
})(jQuery, window, document);



/*========================================================
 * 弹出框
 * =======================================================*/
// TODO F7有些方法没实现,暂时不需要
;
(function ($, window, document, undefined) {
    var modalStack = [];
    var _modalTemplateTempDiv = document.createElement('div');

    function modal(params) {
        params = params || {};
        var modalHTML = '';
        var buttonsHTML = '';
        if (params.buttons && params.buttons.length > 0) {
            for (var i = 0; i < params.buttons.length; i++) {
                buttonsHTML += '<span class="modal-button' + (params.buttons[i].bold ? ' modal-button-bold' : '') + '">' + params.buttons[i].text + '</span>';
            }
        }
        var titleHTML = params.title ? '<div class="modal-title">' + params.title + '</div>' : '';
        var textHTML = params.text ? '<div class="modal-text">' + params.text + '</div>' : '';
        var afterTextHTML = params.afterText ? params.afterText : '';
        var noButtons = !params.buttons || params.buttons.length === 0 ? 'modal-no-buttons' : '';
        var verticalButtons = params.verticalButtons ? 'modal-buttons-vertical' : '';
        modalHTML = '<div class="modal ' + noButtons + ' ' + (params.cssClass || '') + '"><div class="modal-inner">' + (titleHTML + textHTML + afterTextHTML) + '</div><div class="modal-buttons ' + verticalButtons + '">' + buttonsHTML + '</div></div>';


        _modalTemplateTempDiv.innerHTML = modalHTML;

        var modal = $(_modalTemplateTempDiv).children();

        $('body').append(modal[0]);

        // Add events on buttons
        modal.find('.modal-button').each(function (index, el) {
            $(el).on('click', function (e) {
                if (params.buttons[index].close !== false) closeModal(modal);
                if (params.buttons[index].onClick) params.buttons[index].onClick(modal, e);
                if (params.onClick) params.onClick(modal, index);
            });
        });
        openModal(modal);
        return modal;
    }

    function openModal(modal) {
        modal = $(modal);
        var isModal = modal.hasClass('modal');
        if ($('.modal.modal-in:not(.modal-out)').length && isModal) {
            modalStack.push(function () {
                openModal(modal);
            });
            return;
        }
        // do nothing if this modal already shown
        if (true === modal.data('f7-modal-shown')) {
            return;
        }
        modal.data('f7-modal-shown', true);
        modal.trigger('close', function () {
            modal.removeData('f7-modal-shown');
        });
        if (isModal) {
            modal.show();
            modal.css({
                marginTop: -Math.round(modal.outerHeight() / 2) + 'px'
            });
        }

        if ($('.modal-overlay').length === 0) {
            $('body').append('<div class="modal-overlay"></div>');
        }
        var overlay = $('.modal-overlay');
        //Make sure that styles are applied, trigger relayout;
        var clientLeft = modal[0].clientLeft;//这个不能删,删了actions动画没了.
        // Trugger open event
        modal.trigger('open');
        // Classes for transition in
        overlay.addClass('modal-overlay-visible');
        modal.removeClass('modal-out').addClass('modal-in').transitionEnd(function (e) {
            if (modal.hasClass('modal-out')) modal.trigger('closed');
            else modal.trigger('opened');
        });
        return true;
    }

    function closeModal(modal) {
        modal = $(modal || '.modal-in');
        if (typeof modal !== 'undefined' && modal.length === 0) {
            return;
        }
        var isModal = modal.hasClass('modal');
        var overlay = $('.modal-overlay');
        if (overlay && overlay.length > 0) {
            overlay.removeClass('modal-overlay-visible');
        }
        modal.trigger('close');
        modal.removeClass('modal-in').addClass('modal-out').transitionEnd(function (e) {
            if (modal.hasClass('modal-out')) modal.trigger('closed');
            else modal.trigger('opened');
            modal.remove();
        });
        if (isModal) {
            modalStackClearQueue();
        }
        return true;
    }

    function modalStackClearQueue() {
        if (modalStack.length) {
            (modalStack.shift())();
        }
    }

    var modalTitle = '提示';
    var modalButtonOk = '确定';
    var modalButtonCancel = '取消';
    var modalPreloaderTitle = '加载中';
    $.extend({
        alert: function (text, title, callbackOk) {
            if (typeof title === 'function') {
                callbackOk = arguments[1];
                title = undefined;
            }
            return modal({
                text: text || '',
                title: typeof title === 'undefined' ? modalTitle : title,
                buttons: [
                    {text: modalButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        },
        confirm: function (text, title, callbackOk, callbackCancel) {
            if (typeof title === 'function') {
                callbackCancel = arguments[2];
                callbackOk = arguments[1];
                title = undefined;
            }
            return modal({
                text: text || '',
                title: typeof title === 'undefined' ? modalTitle : title,
                buttons: [
                    {text: modalButtonCancel, onClick: callbackCancel},
                    {text: modalButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        },
        showPreloader: function (title) {
            return modal({
                title: title || modalPreloaderTitle,
                text: '<div class="preloader"></div>',
                cssClass: 'modal-preloader'
            });
        },
        hidePreloader: function () {
            closeModal('.modal.modal-in');
        },
        showIndicator: function () {
            //$('body').append('<div class="preloader-indicator-overlay"></div><div class="preloader-indicator-modal"><span class="preloader preloader-white"></span></div>');
            //去掉全屏透明遮盖层
            $('body').append('<div class="preloader-indicator-modal"><span class="preloader preloader-white"></span></div>');
        },
        hideIndicator: function () {
            $('.preloader-indicator-overlay, .preloader-indicator-modal').remove();
        },
        toast: function (text, closeCallBack) {
            var m = modal({
                title: '',
                text: text
            });
            if (closeCallBack) {
                m.on("close", closeCallBack);
            }
            setTimeout(function () {
                closeModal();
            }, 1500);
            return modal
        },
        actions: function (params) {
            var modal, groupSelector, buttonSelector;

            params = params || [];

            if (params.length > 0 && !$.isArray(params[0])) {
                params = [params];
            }
            var modalHTML;

            var buttonsHTML = '';
            for (var i = 0; i < params.length; i++) {
                for (var j = 0; j < params[i].length; j++) {
                    if (j === 0) buttonsHTML += '<div class="actions-modal-group">';
                    var button = params[i][j];
                    var buttonClass = button.label ? 'actions-modal-label' : 'actions-modal-button';
                    if (button.bold) buttonClass += ' actions-modal-button-bold';
                    if (button.color) buttonClass += ' color-' + button.color;
                    if (button.bg) buttonClass += ' bg-' + button.bg;
                    if (button.disabled) buttonClass += ' disabled';
                    buttonsHTML += '<div class="' + buttonClass + '">' + button.text + '</div>';
                    if (j === params[i].length - 1) buttonsHTML += '</div>';
                }
            }
            modalHTML = '<div class="actions-modal">' + buttonsHTML + '</div>';
            _modalTemplateTempDiv.innerHTML = modalHTML;
            modal = $(_modalTemplateTempDiv).children();
            $('body').append(modal[0]);
            groupSelector = '.actions-modal-group';
            buttonSelector = '.actions-modal-button';

            var groups = modal.find(groupSelector);
            groups.each(function (index, el) {
                var groupIndex = index;
                $(el).children().each(function (index, el) {
                    var buttonIndex = index;
                    var buttonParams = params[groupIndex][buttonIndex];
                    var clickTarget;
                    if ($(el).is(buttonSelector)) clickTarget = $(el);
                    if ($(el).find(buttonSelector).length > 0) clickTarget = $(el).find(buttonSelector);

                    if (clickTarget) {
                        clickTarget.on('click', function (e) {
                            if (buttonParams.close !== false) closeModal(modal);
                            if (buttonParams.onClick) buttonParams.onClick(modal, e);
                        });
                    }
                });
            });
            openModal(modal);
            return modal;
        },
        closeModal: closeModal
    });
})(jQuery, window, document);


