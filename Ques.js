/*!
 * Ques - v0.0.1
 * https://github.com/imweb/ques-browser
 */
(function(global, factory) {
    var Ques = factory(require('Q'));
    if (typeof module !== 'undefined' && module && module.exports) {
        module.exports = Ques;
    }
})(window, function(Q) {
    var START_MAX_DEEP = 6,
        rawRequire = require; // alias to require, prevent builds thought it as file deps.

    function extend(arg1, arg2) {
        for (var k in arg2) {
            if (arg2.hasOwnProperty(k)) {
                arg1[k] = arg2[k];
            }
        }
        return arg1;
    };

    return {
        _map: {},

        /**
         * init
         */
        init: function(el, name) {
            if (!el) {
                this._initPage();
            } else {
                this._initMod(el, name || el.getAttribute('q-async'));
            }
        },

        _initPage: function() {
            if (this._initedPage) {
                return ;
            }
            this._initedPage = true;
            // exe page main
            rawRequire('page.main');
            var list = this._findPageMod();
            for (var i in list) {
                var item = list[i];
                this._initMod(item.el, item.name);
            }
        },

        _initMod: function(el, name) {
            var self = this;
            function init() {
                if (el.getAttribute('q-async')) {
                    // set async tpl
                    self._setAsyncTpl(el, rawRequire(name + '.tpl'));
                }
                el.removeAttribute('q-vm');
                el.removeAttribute('q-async');
                new Q(extend({el: el}, rawRequire(self._map[name])));
            }

            this._map[name]
                ? init()
                : rawRequire([name + '.main'], init);
        },

        _setAsyncTpl: function(el, tpl) {
            var match = tpl.match(/^[^<]*(<[^>]*>)([\s\S]*)(<[^>]*>)[^>]*$/);
            if (match) {
                var tmp = document.createElement('div');
                tmp.innerHTML = match[1] + match[3];
                var attrs = tmp.childNodes[0].attributes;
                // copy attrs
                for (var i = attrs.length - 1; i >= 0; i--) {
                    var item = attrs[i];
                    switch (item.name) {
                        case 'class':
                            el.className = item.value + ' ' + el.className;
                            break;
                        case 'style':
                            el.style = item.value + ';' + el.style;
                            break;
                        default:
                            el.setAttribute(item.name, item.value);
                            break;
                    }
                }
                // set html
                el.innerHTML = match[2];
            } else {
                throw new Error('Ques tpl format error');
            }
        },

        addMap: function(map) {
            extend(this._map, map);
            // add Q define
            for (var k in map) {
                if (map.hasOwnProperty(k)) {
                    Q.define(k, rawRequire(map[k]));
                }
            }
        },

        _findPageMod: function() {
            var result = [];
            function find(el, dp) {
                if (el.nodeType === 1) {
                    var vm = el.getAttribute('q-vm');
                    if (vm) {
                        // 入口
                        result.push({
                            el: el,
                            name: vm
                        });
                    } else if (!el.getAttribute('q-async') && dp < START_MAX_DEEP) {
                        for (var i = 0, len = el.childNodes.length; i < len; i++) {
                            find(el.childNodes[i], dp + 1);
                        }
                    }
                }
            }
            find(document.getElementsByTagName('body')[0], 0);
            return result;
        },

        version: '0.0.1'
    };
});

