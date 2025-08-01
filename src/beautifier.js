// v3

// 提供用来监听代码控制的 url 变化的事件
(() => {
    const wrapHistoryMethod = (type) => {
        const orig = history[type];
        return function (...args) {
            const rv = orig.apply(this, args);
            const event = new CustomEvent(type, { detail: args });
            window.dispatchEvent(event);
            return rv;
        };
    };
    history.pushState = wrapHistoryMethod('pushState');
    history.replaceState = wrapHistoryMethod('replaceState');
})();

class Beautifier {
    /**
        * Beautifier 类用于美化页面背景色
        * 
        * 其提供了3个方法：
        * - observe: 开始监听页面变化并美化背景色
        * - disconnect: 停止监听页面变化
        * - undo: 恢复页面背景色到默认状态
        *
        * 可以通过window.beautifier访问实例对象
        * 
     */
    static ignoredSelectors = [
        '.hope-tooltip',
        '.hope-tooltip__arrow',
        '.hope-checkbox__control',
        '.hope-modal__overlay',
        'button:not(.hope-menu__trigger)',
        'svg'
    ];

    static getSelector(mainSelector) {
        return `${mainSelector} :not(${Beautifier.ignoredSelectors.join('):not(')})`;
    }

    static lightSelector = Beautifier.getSelector('.hope-ui-light');
    static darkSelector = Beautifier.getSelector('.hope-ui-dark');

    static lightBgColor = 'rgba(255, 255, 255, 0.8)';
    static darkBgColor = 'rgb(32, 36, 37)';

    static specificPrefix = 'rgba(132, 133, 141';

    constructor() {
        this.observer = null;
    }

    /**
     * @param {'light'|'dark'} theme
     */
    #rewriteStyle(theme) {
        let selector = theme === 'light' ? Beautifier.lightSelector : Beautifier.darkSelector;
        let bgColor = theme === 'light' ? Beautifier.lightBgColor : Beautifier.darkBgColor;

        document.querySelectorAll(selector).forEach(element => {
            const computedStyle = getComputedStyle(element);

            if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                !computedStyle.backgroundColor.startsWith(Beautifier.specificPrefix)) {
                element.style.backgroundColor = bgColor;

                element.setAttribute('data-beautified', 'true');
            }
        });
    }

    #beautify() {
        if (!location.pathname.startsWith('/@manage') && !location.pathname.startsWith('/@login')) {
            this.#rewriteStyle('light');
            this.#rewriteStyle('dark');
        }
    }

    observe() {
        this.observer = new MutationObserver(this.#beautify.bind(this));
        this.observer.observe(document.getElementById('root'), {
            childList: true,
            subtree: true
        });

        this.#beautify();
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    undo() {
        this.disconnect();

        document.body.querySelectorAll('[data-beautified]').forEach(element => {
            element.style.backgroundColor = '';

            element.removeAttribute('data-beautified');
        });
    }
}

const beautifier = new Beautifier();
window.beautifier = beautifier;

beautifier.observe();

// 一个愚蠢到有点无敌的修复机制，不过工作良好
(() => {
    function fixLogin(pathname) {
        if (pathname.startsWith('/@login')) {
            beautifier.undo();
        }
        else {
            beautifier.disconnect();
            beautifier.observe();
        }
    }

    ['popstate', 'pushState', 'replaceState'].forEach(eventType => {
        addEventListener(eventType, () => {
            fixLogin(location.pathname);
        });
    });
})();