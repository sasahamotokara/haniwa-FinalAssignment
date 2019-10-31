(function (win, doc, $, mql) {
    'use strict';

    if (!$) {
        return;
    }

    const body = doc.body;
    const html = doc.documentElement;
    const $win = $(win);
    const $body = $('body');
    const FOCUS_ELEMS = 'a[href], area[href], [tabindex], button, input, select, textarea, iframe, object, audio, video, embed, summary';
    const UA = win.navigator.userAgent;
    const isWebkit = /WebKit/.test(UA) && !doc.scrollingElement;
    const scrollElem = isWebkit ? body : doc.scrollingElement || html;
    const $scrollElem = $(scrollElem);
    const randomString = function () {
        return Math.random().toString(36).slice(-8);
    };

    // 機能実装
    $(function () {
        // スムーススクロール
        $('a[href^="#"]').setSmoothScroll({
            saveHistory: false,
            adjust: {
                setting: true,
                fixedElement: '.site-header'
            }
        }).on('smoothScroll.scrollBefore', function (e) {
            const $clickTarget = $('.js-drawer-toggle[aria-expanded="true"]');

            if ($clickTarget.length) {
                $clickTarget.trigger('click.drawer');
            }

            return false;
        });

        // トグル
        $('.js-tgl').setToggle();

        // フローティング(トップへ戻るボタン)
        $('#scroll-top').setFloatingContent({
            startLine: 200,
            setEndLine: true
        });

        // フローティング(ヘッダー)
        $('#js-floating').setFloatingContent({
            startLine: 100
        });

        $('.js-carousel').setCarousel({
            autoPlay: {
                setting: false
            },
            createControlButton: {
                setting: false
            },
            className: {
                itemWrap: 'list-results'
            }
        });

        $('#js-drawer').setDrawer({
            responsive: 'SP',
            createOpenButton: {
                buttonStyle: 'hamberger'
            }
        });

        $('.form-wrap').setFormValidate({
            submitButton: '#form-submit',
            permissionControl: {
                setting: true,
                interLock: '[data-requirements]'
            }
        });

        $('#form-submit').sendMail();
    });

    // 機能本体
    // スムーススクロール
    (function () {
        $.fn.setSmoothScroll = function (options) {
            const t = this;
            const config = $.extend(true, {
                saveHistory: true,
                animation: {
                    durtion: 400,
                    easing: '' // swing or linear
                },
                adjust: {
                    setting: false,
                    fixedElement: '',
                    increase: 0, // scroll-length plus +
                    decrease: 0, // scroll-length minus -
                    responsive: '' // PC or SP
                }
            }, options);

            t.each(function () {
                $(this).data('setSmoothScroll', new SmoothScroll($(this), config));
            });

            return this;
        };

        const SmoothScroll = function ($root, config) {
            const namespace = 'smoothScroll';
            const targetUrl = $root.attr('href');
            const $target = targetUrl === '#' || targetUrl === '#top' || targetUrl === '' ? $scrollElem : $(targetUrl);
            let scrollPosition;
            let events = {
                before: namespace + '.scrollBefore',
                after: namespace + '.scrollAfter'
            };

            const method = {
                init: function () {
                    if (!$root.length || !$target.length) {
                        return;
                    }

                    method.bind();
                },
                bind: function () {
                    $root.on('click.' + namespace, function (e) {
                        const $this = $(this);

                        e.preventDefault();
                        $this.trigger(events.before);
                        method.setPosition();
                        method.scroll();
                    });
                },
                setPosition: function () {
                    let position;

                    if (config.adjust.setting) {
                        if (config.adjust.responsive !== mql.state) {
                            const $fixed = $(config.adjust.fixedElement).eq(0);
                            const fixedHeight = $fixed.outerHeight();

                            position = $target.offset().top - fixedHeight;
                        } else {
                            position = $target.offset().top;
                        }
                    } else {
                        position = $target.offset().top;
                    }

                    // 絶対数調整
                    scrollPosition = position + (config.adjust.increase - config.adjust.decrease);
                },
                scroll: function () {
                    $scrollElem.not(':animated').animate({
                        scrollTop: scrollPosition
                    }, config.animation.durtion, config.animation.easing);

                    $target.attr('tabindex', 0).focus().css('outline', 'none').removeAttr('tabindex');
                    $target.on('blur.' + namespace, function () {
                        const $this = $(this);

                        $this.css('outline', '');
                        $this.off('blur.' + namespace);
                    });

                    if (config.saveHistory) {
                        win.history.pushState(null, null, targetUrl);
                    }

                    $root.trigger(events.after);
                }
            };

            return method.init();
        };
    }());

    // トグル
    (function () {
        $.fn.setToggle = function (options) {
            const t = this;
            const config = $.extend(true, {
                responsive: '', // PC or SP (only screen)
                overlay: false,
                createCloseButton: false,
                animation: {
                    durtion: 200,
                    easing: '' // ease or swing or linear
                },
                className: {
                    buttonToggle: 'tgl-ctrls',
                    buttonClose: 'tgl-close',
                    toggleHeading: 'tgl-hdg',
                    toggleContent: 'tgl-content',
                    overlay: 'tgl-layer',
                    open: 'is-open',
                    visible: 'is-visible',
                    noscroll: 'no-scroll',
                    altText: 'alt-text'
                },
                altText: {
                    open: '\u958B\u304F', // 開く
                    close: '\u9589\u3058\u308B' // 閉じる
                },
                prefix: {
                    id: 'toggle-',
                    data: 'toggle'
                }
            }, options);

            t.each(function () {
                $(this).data('setSmoothScroll', new Toggle($(this), config));
            });

            return this;
        };

        const Toggle = function ($root, config) {
            const namespace = 'toggle';
            const $hdg = $root.find('.' + config.className.toggleHeading);
            const $content = $root.find('.' + config.className.toggleContent);
            const idName = config.prefix.id + randomString();
            let $ctrls;
            let $state;
            let $altText;
            let $overlay;
            let $closeButton;
            let contentHeight;
            let state = {
                isRunFlag: false,
                isOpenFlag: false,
                isAnimationFlag: false
            };
            let events = {
                opend: namespace + '.opened',
                closed: namespace + '.closed'
            };

            const method = {
                init: function () {
                    if (!$hdg.length || !$content.length) {
                        $.error('Required elements are missing, please check the markup.');

                        return;
                    }

                    if ($content.hasClass(config.className.open)) {
                        state.isOpenFlag = true;
                    }

                    state.isRunFlag = true;

                    method.build();
                    method.bind();

                    if (config.responsive !== '') {
                        $win.on('load onMachMedia', function () {
                            if (!/PC|SP/.test(config.responsive)) {
                                return;
                            }

                            method.close();

                            if (!state.isRunFlag && config.responsive === mql.state) {
                                state.isRunFlag = true;

                                method.build();
                                method.bind();
                            } else if (state.isRunFlag && config.responsive !== mql.state) {
                                method.destory();
                            }
                        });
                    }
                },
                build: function () {
                    if (!$root.find('.' + config.className.buttonToggle).length) {
                        $altText = $('<span>', {
                            class: config.className.altText,
                            text: state.isOpenFlag ? config.altText.close : config.altText.open
                        });

                        $hdg.wrapInner($('<button>', {
                            class: config.className.buttonToggle,
                            type: 'button',
                            role: 'button',
                            'aria-controls': idName
                        }));
                        $ctrls = $root.find('.' + config.className.buttonToggle);
                        $ctrls.append($altText);
                    } else {
                        $ctrls = $root.find('.' + config.className.buttonToggle);
                        $state = $ctrls.find('.' + config.className.altText);

                        if (!$state.length) {
                            $ctrls.append($('<span>', {
                                class: config.className.altText,
                                text: state.isOpenFlag ? config.altText.close : config.altText.open
                            }));
                        }

                        $ctrls.attr('aria-controls', idName);
                    }

                    if (config.createCloseButton) {
                        $closeButton = $('<button>', {
                            class: config.className.buttonClose,
                            type: 'button',
                            role: 'button',
                            'aria-controls': idName
                        }).append($('<span>', {
                            class: config.className.altText,
                            text: state.isOpenFlag ? config.altText.close : config.altText.open
                        }));

                        $content.append($closeButton);
                    }

                    if (config.overlay) {
                        $overlay = $('<div>', {
                            class: config.className.overlay
                        });

                        $root.append($overlay);
                    }

                    method.set();
                },
                set: function () {
                    $ctrls.attr({
                        role: 'button',
                        'aria-expanded': state.isOpenFlag
                    });

                    $content.attr({
                        id: idName,
                        'aria-expanded': state.isOpenFlag,
                        'aria-hidden': !state.isOpenFlag
                    }).css({
                        height: state.isOpenFlag ? '' : 0,
                        transition: 'height ' + (config.animation.durtion / 1000) + 's ' + config.animation.easing
                    });

                    $content.find(FOCUS_ELEMS).attr({
                        tabindex: state.isOpenFlag ? 0 : -1
                    });
                },
                bind: function () {
                    $ctrls.on('click.' + namespace, function (e) {
                        e.preventDefault();
                        if (state.isAnimationFlag) {
                            return;
                        }

                        contentHeight = $content[0].scrollHeight;
                        state.isAnimationFlag = true;
                        method.toggle();
                    });

                    $content.on('transitionend', function () {
                        state.isAnimationFlag = false;
                        method.toggleHiddenAttr();
                    });

                    if (config.createCloseButton) {
                        $closeButton.on('click.' + namespace, function (e) {
                            e.preventDefault();
                            contentHeight = $content[0].scrollHeight;
                            method.toggle();
                        });
                    }

                    if (config.overlay) {
                        $overlay.on('click.' + namespace, function (e) {
                            e.preventDefault();
                            if (!state.isOpenFlag) {
                                return;
                            }
                            contentHeight = $content[0].scrollHeight;
                            method.toggle();
                        });
                    }
                },
                toggle: function () {
                    const isOpenFlag = state.isOpenFlag;

                    $altText = $ctrls.find('.' + config.className.altText);

                    if (isOpenFlag) {
                        $content.removeClass(config.className.open).css('height', contentHeight);
                        state.isOpenFlag = false;
                    } else {
                        $content.addClass(config.className.open).attr({
                            'aria-hidden': false
                        });
                        state.isOpenFlag = true;
                    }

                    $content.attr({
                        'aria-expanded': isOpenFlag
                    }).css('height', isOpenFlag ? 0 : contentHeight);

                    $content.find(FOCUS_ELEMS).attr({
                        tabindex: isOpenFlag ? -1 : 0
                    });

                    $ctrls.attr({
                        'aria-expanded': !isOpenFlag
                    });

                    $altText.text(isOpenFlag ? config.altText.open : config.altText.close);

                    if (config.overlay) {
                        if (state.isOpenFlag) {
                            $body.removeClass(config.className.noscroll);
                            $overlay.removeClass(config.className.visible);
                        } else {
                            $body.addClass(config.className.noscroll);
                            $overlay.addClass(config.className.visible);
                        }
                    }

                    $root.trigger(isOpenFlag ? events.closed : events.opend);
                },
                close: function () {
                    $altText = $ctrls.find('.' + config.className.altText);

                    $content.attr({
                        'aria-expanded': false
                    }).removeClass(config.className.open).css('height', 0);

                    $ctrls.attr({
                        'aria-expanded': false
                    });

                    $altText.text(config.altText.open);

                    state.isOpenFlag = false;

                    $root.trigger(events.closed);
                },
                toggleHiddenAttr: function () {
                    if (state.isOpenFlag) {
                        $content.css('height', 'auto');
                        $content.attr({
                            'aria-hidden': true
                        });

                        return;
                    }

                    $content.attr({
                        'aria-hidden': false
                    });
                },
                destory: function () {
                    state.isRunFlag = false;
                    state.isOpenFlag = false;

                    $ctrls.off('click.' + namespace);
                    $ctrls.removeAttr('aria-controls aria-expanded');
                    $content.removeClass(config.className.open).removeAttr('id aria-expanded aria-hidden').css({
                        height: '',
                        transition: ''
                    });
                    $content.off('transitionend');
                    $content.find(FOCUS_ELEMS).removeAttr('tabindex');

                    if (config.overlay) {
                        $body.removeClass(config.className.noscroll);
                        $root.find('.' + config.className.overlay).remove();
                    }

                    if (config.createCloseButton) {
                        $closeButton = $content.find('.' + config.className.closeButton);

                        $closeButton.off('click.' + namespace);
                        $closeButton.remove();
                    }
                }
            };

            return method.init();
        };
    }());

    // フローティング
    (function () {
        $.fn.setFloatingContent = function (options) {
            const t = this;
            const config = $.extend(true, {
                startLine: 0,
                setEndLine: false,
                className: {
                    fixed: 'is-fixed',
                    animate: 'floating'
                }
            }, options);

            t.each(function () {
                $(this).data('setSmoothScroll', new Floating($(this), config));
            });

            return this;
        };

        const Floating = function ($root, config) {
            const namespace = 'floating';
            let scrollLen;
            let endLine;
            let scrollHeight;
            let clientHeight;
            let scrollFromBottom;
            let timer = 0;
            let state = {
                isFixedFlag: false,
                isVisibleFlag: false
            };

            const method = {
                init: function () {
                    method.update();
                    method.bind();
                },
                bind: function () {
                    $win.on({
                        resize: function () {
                            if (timer > 0) {
                                clearTimeout(timer);
                            }

                            timer = setTimeout(function () {
                                $win.trigger('scroll');
                            }, 120);
                        },
                        scroll: function () {
                            if (timer > 0) {
                                clearTimeout(timer);
                            }

                            timer = setTimeout(function () {
                                scrollLen = $win.scrollTop();
                                method.update();

                                if(scrollLen >= config.startLine && scrollFromBottom > endLine) {
                                    if (state.isFloating) {
                                        return;
                                    }

                                    $root.addClass(config.className.fixed + ' ' + config.className.animate);
                                    state.isFixedFlag = true;
                                    state.isVisibleFlag = true;
                                } else {
                                    if (!state.isFixedFlag) {
                                        return;
                                    }

                                    if (scrollLen <= config.startLine) {
                                        if (!state.isVisibleFlag) {
                                            return;
                                        }

                                        $root.removeClass(config.className.animate);
                                        state.isVisibleFlag = false;
                                        return;
                                    }

                                    if (config.setEndLine) {
                                        $root.removeClass(config.className.fixed);
                                        state.isFloating = false;
                                    }
                                }
                            }, 5);
                        }
                    });
                },
                update: function () {
                    scrollHeight = scrollElem.scrollHeight;
                    endLine = $root.outerHeight();
                    clientHeight = scrollElem.clientHeight;
                    scrollFromBottom = scrollHeight - (scrollLen + clientHeight);
                }
            };

            return method.init();
        };
    }());

    // カルーセル(研究中)
    (function () {
        $.fn.setCarousel = function (options) {
            const t = this;
            const config = $.extend(true, {
                defaultCurrent: 0,
                viewInWrap: 3,
                scrollLength: 1,
                endless: true,
                centerMode: true,
                responsive: '', // null, set break-point, and settings.
                autoPlay: {
                    setting: true,
                    interval: 5000
                },
                createControlButton: {
                    setting: true,
                    className: {
                        wrap: 'carousel-control',
                        prev: 'carousel-previous',
                        next: 'carousel-next',
                        pause: 'carousel-pause',
                        play: 'carousel-play'
                    }
                },
                createCurrentIndicator: {
                    setting: true,
                    className: {
                        indicator: 'carousel-indicator'
                    }
                },
                className: {
                    wrap: 'carousel-wrap',
                    itemWrap: 'carousel-list',
                    item: 'carousel-item',
                    active: 'is-active',
                    current: 'is-current',
                    altText: 'alt-text'
                },
                idName: {
                    item: 'carousel-item',
                    indicator: 'carousel-indicator'
                },
                altText: {
                    prev: '\u524d\u3078', // 前へ
                    next: '\u6b21\u3078', // 次へ
                    pause: '\u505c\u6b62', // 停止
                    play: '\u518d\u751f' // 再生
                },
                prefix: {
                    id: 'carousel-',
                    data: 'carousel'
                }
            }, options);

            t.each(function () {
                $(this).data('setSmoothScroll', new Carousel($(this), config));
            });

            return this;
        };

        const Carousel = function ($root, config) {
            const namespace = 'carousel';
            const $itemWrap = $root.find('.' + config.className.itemWrap);
            const multiple = config.centerMode ? Number(config.viewInWrap) : Number(config.viewInWrap + 1);
            let $item = $itemWrap.find('.' + config.className.item);
            let $itemOuter = $item.outerWidth();
            let $itemWidth = $item.width();
            let $itemLength = $item.length;
            let $currentItem = $();
            let $wrap;
            let $wrapWidth;
            let $wrapOuter;
            let $control;
            let $prev;
            let $pause;
            let $next;
            let $indicatorWrap;
            let $indicator;
            let $currentIndicator;
            let idxNum;
            let carouselWidth;
            let itemSpace;
            let viewInWrap;
            let state = {
                currentIndex: config.defaultCurrent,
                originItemLength: $itemLength,
                isAnimateFlag: false,
                isFocusFlag: false,
                isPlayFlag: false,
                swipe: {},
                isHindranceFlag: false,
                isDraggFlag: false,
                isScrollFlag: false,
                isSwipeFlag: false,
                canClick: true,
                isCallFlag: false,
                trigger: 180
            };

            const method = {
                init: function () {
                    if (state.originItemLength > 1) {
                        method.build();
                        method.set();
                        method.bind();
                    }
                },
                build: function () {
                    $root.wrapInner('<div class="' + config.className.wrap + '" aria-live="polite">');

                    if(config.endless) method.endlessMode();
                    if (config.autoPlay.setting) method.play();
                    if (config.createControlButton.setting) method.createControlUi();
                    if (config.createCurrentIndicator.setting) method.createIndicator();
                },
                set: function () {
                    $root.attr({
                        role: 'toolbar'
                    });

                    $itemWrap.attr({
                        role: 'listbox'
                    });

                    $item.attr({
                        role: 'option',
                        'aria-hidden': true
                    });

                    $item.find(FOCUS_ELEMS).attr({
                        tabindex: -1
                    });

                    for (let i = 0; i < state.originItemLength; i++) {
                        $($item[i]).attr({
                            id: config.idName.item + i,
                            'aria-discribedby': config.idName.indicator + i
                        });
                    }

                    method.setWidth();
                    method.setPosition();
                },
                bind: function () {
                    $item.on('dragstart', function (e) {
                        e.preventDefault();
                    });

                    $win.on('resize.' + namespace, function () {
                        let timer = 0;

                        if (timer > 0) {
                            clearTimeout(timer);
                        }

                        timer = setTimeout(function () {
                            method.setWidth();
                            method.setPosition();
                        }, 120);

                        if (config.autoPlay.setting && state.isPlayFlag) {
                            method.pause();
                            method.play();
                        }
                    });

                    $item.find(FOCUS_ELEMS).on({
                        focus: function () {
                            state.isFocusFlag = true;
                            state.canClick = true;
                        },
                        blur: function () {
                            state.isFocusFlag = false;
                        }
                    });

                    $itemWrap.on('transitionend', function () {
                        $itemWrap.css('transition', '');

                        state.isAnimateFlag = false;

                        if (state.currentIndex >= state.originItemLength) {
                            state.currentIndex = 0;
                            method.setPosition();
                        } else if (state.currentIndex < 0) {
                            state.currentIndex = state.originItemLength - 1;
                            method.setPosition();
                        }
                        method.focus();
                    });

                    if (config.createControlButton.setting) {
                        $prev.on('click.' + namespace, function (e) {
                            e.preventDefault();

                            if (state.isAnimateFlag) {
                                return;
                            }

                            method.prev();
                        });

                        $next.on('click.' + namespace, function (e) {
                            e.preventDefault();

                            if (state.isAnimateFlag) {
                                return;
                            }

                            method.next();
                        });

                        $pause.on('click.' + namespace, function (e) {
                            const $altText = $pause.find('.' + config.className.altText);

                            e.preventDefault();
                            if (state.isPlayFlag) {
                                $pause.removeClass(config.createControlButton.className.pause).addClass(config.createControlButton.className.play);
                                $altText.text(config.altText.play);

                                method.pause();
                            } else {
                                $pause.removeClass(config.createControlButton.className.play).addClass(config.createControlButton.className.pause);
                                $altText.text(config.altText.pause);

                                method.play();
                            }
                        });
                    }

                    if (config.createCurrentIndicator.setting) {
                        $indicator.find('button').on('click.' + namespace, function (e) {
                            const $btn = $(this);
                            const $parent = $btn.parent('li');

                            e.preventDefault();
                            state.currentIndex = $parent.data('carousel-index');
                            method.current();
                        });
                    }

                    $root.find('.' + config.className.wrap).on({
                        'touchstart mousedown touchmove mousemove touchend mouseup touchcancel mouseleave': function (e) {
                            state.swipe.touches = e.changedTouches;
                            state.swipe.touchInfo = state.swipe.touches && state.swipe.touches[0];
                            state.swipe.fingerCount = (state.swipe.touches !== undefined) ? state.swipe.touches.length : 1;

                            if (/touchstart|mousedown/.test(e.type)) {
                                state.isHindranceFlag = true;

                                if (state.swipe.fingerCount !== 1) {
                                    state.swipe = {};

                                    return;
                                }

                                state.swipe.startY = state.swipe.currentY = (state.swipe.touchInfo !== undefined) ? state.swipe.touchInfo.pageY : e.clientY;
                                state.swipe.startX = state.swipe.currentX = (state.swipe.touchInfo !== undefined) ? state.swipe.touchInfo.pageX : e.clientX;
                                state.swipe.distanceX = Math.round(Math.abs(state.swipe.currentX - state.swipe.startX));
                                state.swipe.distanceY = Math.round(Math.abs(state.swipe.currentY - state.swipe.startY));

                                state.isDraggFlag = true;
                            } else if (/touchmove|mousemove/.test(e.type)) {
                                let positionValue = 0;
                                let positionOffset = 0;

                                if (!state.isDraggFlag || state.isScrollFlag || state.swipe.fingerCount !== 1) {
                                    return;
                                }

                                state.swipe.currentX = (state.swipe.touchInfo !== undefined) ? state.swipe.touchInfo.pageX : e.clientX;
                                state.swipe.currentY = (state.swipe.touchInfo !== undefined) ? state.swipe.touchInfo.pageY : e.clientY;
                                state.swipe.distanceX = Math.round(Math.abs(state.swipe.currentX - state.swipe.startX));
                                state.swipe.distanceY = Math.round(Math.abs(state.swipe.currentY - state.swipe.startY));

                                if (!state.isSwipeFlag && state.swipe.distanceY > 4) {
                                    state.isScrollFlag = true;
                                    return false;
                                }

                                if (state.swipe.distanceX > 4) {
                                    e.preventDefault();
                                    state.isSwipeFlag = true;
                                }

                                if (state.isAnimateFlag === true) {
                                    return;
                                }

                                positionValue = ($wrapWidth * (state.currentIndex + config.viewInWrap) * -1);
                                positionOffset = (state.swipe.currentX > state.swipe.startX) ? 1 : -1;

                                $itemWrap.css('transform', 'translateX(' + (positionValue + (state.swipe.distanceX * positionOffset)) + 'px)');
                            } else if (/touchend|mouseup|touchcancel|mouseleave/.test(e.type)) {
                                state.isDraggFlag = false;

                                if (state.isScrollFlag) {
                                    state.isScrollFlag = false;

                                    return;
                                }

                                state.isSwipeFlag = false;
                                state.isHindranceFlag = false;
                                state.canClick = (state.swipe.distanceX < 10);

                                if (state.swipe.currentX === undefined) {
                                    return;
                                }

                                if (state.swipe.distanceX > state.trigger) {
                                    if (state.swipe.currentX > state.swipe.startX) {
                                        state.currentIndex--;
                                    } else {
                                        state.currentIndex++;
                                    }
                                }

                                if (state.swipe.startX !== state.swipe.currentX) {
                                    method.current();
                                }

                                state.swipe = {};
                            }
                        },

                        mouseenter: function () {
                            state.isDraggFlag = true;
                        },

                        mouseleave: function () {
                            state.isDraggFlag = false;
                        },

                        click: function (e) {
                            if (state.canClick === false) {
                                e.stopImmediatePropagation();
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }
                    });
                },
                setWidth: function () {
                    $itemOuter = $item.outerWidth();
                    $itemWidth = $item.width();
                    $wrap = $root.find('.' + config.className.wrap);
                    $wrapWidth = $wrap.outerWidth();
                    $wrapOuter = $wrap.outerWidth(true);
                    carouselWidth = $wrapWidth * $itemLength;
                    itemSpace = $itemOuter - $itemWidth;

                    $itemWrap.css('width', carouselWidth + 'px');
                    $item.css('width', $wrapWidth + 'px');
                },
                setPosition: function () {
                    idxNum = config.endless ? Number(state.currentIndex + multiple) : Number(state.currentIndex);
                    $currentItem = method.getCurrentItem();

                    if (!$currentItem.length) {
                        return;
                    }

                    $itemWrap.css('transform', 'translateX(' + (($wrapWidth * idxNum * config.scrollLength) * -1) + 'px)');

                    method.focus();
                },
                focus: function () {
                    $item.removeClass(config.className.active).attr({
                        'aria-hidden': true
                    });

                    $item.find(FOCUS_ELEMS).attr({
                        tabindex: -1
                    });

                    $currentItem.addClass(config.className.active).attr({
                        'aria-hidden': false
                    });

                    $currentItem.find(FOCUS_ELEMS).attr({
                        tabindex: 0
                    });
                },
                createControlUi: function () {
                    let buttonArray = [];

                    $control = $('<ul>', {
                        class: config.createControlButton.className.wrap
                    });
                    $prev = $('<button>', {
                        class: config.createControlButton.className.prev,
                        type: 'button',
                        role: 'button',
                        'aria-label': config.altText.prev
                    }).append($('<span>', {
                        class: config.className.altText,
                        text: config.altText.prev
                    }));

                    $pause = $('<button>', {
                        class: config.createControlButton.className.pause,
                        type: 'button',
                        role: 'button',
                        'aria-label': config.altText.pause
                    }).append($('<span>', {
                        class: config.className.altText,
                        text: config.altText.pause
                    }));

                    $next = $('<button>', {
                        class: config.createControlButton.className.next,
                        type: 'button',
                        role: 'button',
                        'aria-label': config.altText.next
                    }).append($('<span>', {
                        class: config.className.altText,
                        text: config.altText.next
                    }));

                    buttonArray = [$prev, $pause, $next];

                    for (let i = 0; buttonArray.length > i; i++) {
                        const $li = $('<li>');

                        $li.append(buttonArray[i]);
                        $control.append($li);
                    }

                    $itemWrap.before($control);
                },
                createIndicator: function () {
                    $indicator = $('<ul>', {
                        class: config.createCurrentIndicator.className.indicator,
                        role: 'tablist'
                    });

                    for (let i = 0; i < state.originItemLength; i++) {
                        const item = $('<li>', {
                            id: config.idName.indicator + i,
                            role: 'presentation',
                            'data-carousel-index': i,
                            'aria-selected': false,
                            'aria-hidden': true,
                            'aria-controls': config.idName.item + i
                        }).append($('<button>', {
                            type: 'button',
                            role: 'button',
                            tabindex: 0
                        }).append($('<span>', {
                            class: config.className.altText,
                            text: (i + 1)
                        })));

                        $indicator.append(item);
                    }

                    $root.append($indicator);
                    method.updateIndicator();
                },
                updateIndicator: function () {
                    let currentIndex = state.currentIndex;

                    $indicatorWrap = $root.find('.' + config.createCurrentIndicator.className.indicator);
                    $indicator = $indicatorWrap.find('li');

                    if (currentIndex < 0) {
                        currentIndex = ($indicator.length - 1);
                    } else if (currentIndex >= $indicator.length) {
                        currentIndex = 0;
                    }

                    $currentIndicator = $indicatorWrap.find('[aria-controls="' + config.idName.item + currentIndex + '"]');
                    $indicator.removeClass(config.className.current);
                    $currentIndicator.addClass(config.className.current);
                },
                getCurrentItem: function () {
                    let num = 1;
                    let currentIndex = state.currentIndex;

                    $currentItem = $();
                    viewInWrap = Math.floor(($wrapOuter + itemSpace) / $wrapWidth);

                    if (currentIndex < 0) {
                        currentIndex = state.originItemLength;
                    } else if (currentIndex > state.originItemLength) {
                        currentIndex = 0;
                    }

                    if (viewInWrap === 1) {
                        num = currentIndex;
                    } else {
                        num = config.centerMode ? currentIndex - 1 : currentIndex;
                    }

                    for (let i = 0; i < viewInWrap; i++) {
                        $currentItem = $currentItem.add($itemWrap.find('#' + config.idName.item + (num + i)));
                    }

                    return $currentItem;
                },
                current: function () {
                    if (state.isAnimateFlag) {
                        return;
                    }

                    state.isAnimateFlag = true;

                    $itemWrap.css('transition', 'transform .5s ease 0s');

                    method.setPosition();

                    if (config.createCurrentIndicator.setting) {
                        method.updateIndicator();
                    }

                    if (config.autoPlay.setting && state.isPlayFlag) {
                        method.pause();
                        method.play();
                    }
                },
                prev: function () {
                    if (!config.endless && state.currentIndex === 0) {
                        return;
                    }

                    state.currentIndex--;
                    method.current();
                },
                next: function () {
                    if (!config.endless && state.currentIndex === ($itemLength - 1)) {
                        return;
                    }

                    state.currentIndex++;
                    method.current();
                },
                play: function () {
                    state.timer = setInterval(function () {
                        if (!state.isFocusFlag) {
                            state.currentIndex++;
                            method.current();
                        }
                    }, config.autoPlay.interval);

                    state.isPlayFlag = true;
                },
                pause: function () {
                    if (state.timer) {
                        clearInterval(state.timer);
                        state.isPlayFlag = false;
                    }
                },
                endlessMode: function () {
                    if (config.viewInWrap <= 1) {
                        return;
                    }

                    for (let i = 0; i < config.viewInWrap; i++) {
                        const $cloneElement = $item.eq(i).clone();

                        $cloneElement.attr({
                            id: config.idName.item + ($itemLength + i)
                        }).appendTo($itemWrap);
                    }

                    for (let i = 0; i < config.viewInWrap; i++) {
                        const $cloneElement = $item.eq(($itemLength - 1) - i).clone();

                        $cloneElement.attr({
                            id: config.idName.item + ((-1) - i)
                        }).prependTo($itemWrap);
                    }

                    $item = $itemWrap.find('.' + config.className.item);
                    $itemLength = $item.length;
                }
            };

            return method.init();
        };
    }());

    // ドロワーメニュー
    (function () {
        $.fn.setDrawer = function (options) {
            const t = this;
            const config = $.extend(true, {
                responsive: '', // PC or SP
                showOverlay: true,
                createOpenButton: {
                    setting: true,
                    buttonStyle: '',
                    buttonMode: 'toggle' // toggle or open (empty => open)
                },
                createCloseButton: {
                    setting: false
                },
                className: {
                    ctrls: 'drawer-item',
                    buttonOpen: 'js-drawer-open',
                    buttonClose: 'js-drawer-close',
                    buttonToggle: 'js-drawer-toggle',
                    open: 'is-open',
                    noscroll: 'no-scroll',
                    visible: 'is-visible',
                    altText: 'alt-text'
                },
                idName: {
                    overlay: 'layer'
                },
                altText: {
                    open: '\u958B\u304F', // 開く
                    close: '\u9589\u3058\u308B' // 閉じる
                },
                prefix: {
                    id: 'drawer-',
                    data: 'drawer'
                }
            }, options);


            t.each(function () {
                $(this).data('setDrawer', new Drawer($(this), config));
            });

            return this;
        };

        const Drawer = function ($root, config) {
            const namespace = 'drawer';
            const $ctrls = $root.find('.' + config.className.ctrls);
            const idName = config.prefix.id + randomString();
            let $ctrlButton;
            let $closeButton;
            let $overlay;
            let state = {
                isRunFlag: false,
                currentElm: $(),
                isOpenFlag: false
            };
            let events = {
                opend: namespace + '.opened',
                closed: namespace + '.closed'
            };

            const method = {
                init: function () {
                    if (!$ctrls.length) {
                        $.error('Required elements are missing, please check the markup.');

                        return;
                    }

                    state.isRunFlag = true;

                    method.build();
                    method.set();
                    method.bind();

                    if (config.responsive !== '') {
                        $win.on('load onMachMedia', function () {
                            if (!/PC|SP/.test(config.responsive)) {
                                return;
                            }

                            method.close();

                            if (!state.isRunFlag && config.responsive === mql.state) {
                                state.isRunFlag = true;

                                method.build();
                                method.set();
                                method.bind();
                            } else if (state.isRunFlag && config.responsive !== mql.state) {
                                method.destory();
                            }
                        });
                    }
                },
                build: function () {
                    if (config.createOpenButton.setting) {
                        $ctrlButton = $('<button>', {
                            class: config.createOpenButton.buttonMode === 'toggle' ? config.className.buttonToggle : config.className.buttonOpen,
                            type: 'button',
                            role: 'button',
                            'aria-controls': idName,
                            'aria-expanded': false
                        }).append($('<span>', {
                            class: config.className.altText,
                            text: config.altText.open
                        }));

                        if (config.createOpenButton.buttonStyle !== '') {
                            $ctrlButton.append($('<span>', {
                                class: config.createOpenButton.buttonStyle
                            }));
                        }

                        $ctrls.before($ctrlButton);
                    } else {
                        if (!$('.' + config.className.buttonToggle).length) {
                            $ctrlButton = $root.find('.' + config.className.buttonOpen);
                        } else {
                            $ctrlButton = $root.find('.' + config.className.buttonToggle);
                        }
                    }

                    if (config.createCloseButton.setting) {
                        $closeButton = $('<button>', {
                            class: config.className.buttonClose,
                            type: 'button',
                            'aria-controls': idName,
                            'aria-expanded': false
                        }).append($('<span>', {
                            class: config.className.altText,
                            text: config.altText.close
                        }));

                        $ctrls.prepend($closeButton);
                    }

                    if (config.showOverlay) {
                        $overlay = $('<div>', {
                            id: config.idName.overlay
                        }).on('click.' + namespace, function () {
                            state.currentElm = $('#' + idName).parent();

                            method.close();
                        });

                        $root.append($overlay);
                    }
                },
                set: function () {
                    $ctrls.attr({
                        id: idName,
                        hidden: true,
                        'aria-hidden': true,
                        'aria-expanded': false
                    });

                    $ctrls.find(FOCUS_ELEMS).attr({
                        tabindex: -1
                    });
                },
                bind: function () {
                    $ctrlButton.on('click.' + namespace, function () {
                        method.toggle();
                    });

                    if (config.createCloseButton.setting) {
                        $closeButton.on('click.' + namespace, function () {
                            method.close();
                        });
                    }

                    method.setKeyTrap();
                },
                toggle: function () {
                    if (state.isOpenFlag) {
                        method.close();
                    } else {
                        method.open();
                    }
                },
                open: function () {
                    $root.addClass(config.className.open);
                    $body.addClass(config.className.noscroll).attr('data-' + config.prefix.data, idName);
                    $ctrlButton.attr({
                        'aria-expanded': true
                    });
                    $ctrls.attr({
                        hidden: false,
                        'aria-hidden': false,
                        'aria-expanded': true
                    });
                    $ctrls.find(FOCUS_ELEMS).attr({
                        tabindex: 0
                    });

                    if (config.createOpenButton.buttonMode === 'toggle') {
                        $ctrlButton.find('.' + config.className.altText).text(config.altText.close);
                    }

                    if (config.showOverlay) {
                        $overlay.addClass(config.className.visible);
                    }

                    state.isOpenFlag = true;
                    $ctrls.find(FOCUS_ELEMS).first().focus();
                    $root.trigger(events.opend);
                },
                close: function () {
                    $root.removeClass(config.className.open);
                    $body.removeClass(config.className.noscroll).removeAttr('data-' + config.prefix.data);
                    $ctrlButton.attr({
                        'aria-expanded': false
                    });
                    $ctrls.find(FOCUS_ELEMS).attr({
                        tabindex: -1
                    });
                    $ctrls.attr({
                        hidden: true,
                        'aria-hidden': true,
                        'aria-expanded': false
                    });

                    if (config.createOpenButton.buttonMode === 'toggle') {
                        $ctrlButton.find(' .' + config.className.altText).text(config.altText.open);
                    }

                    if (config.showOverlay) {
                        $overlay.removeClass(config.className.visible);
                    }

                    state.isOpenFlag = false;
                    $root.find('[aria-controls="' + idName + '"]:not(.js-slidein-close)').focus();
                    $root.trigger(events.closed);
                },
                setKeyTrap: function () {
                    $root.on('keydown', function (e) {
                        const $event = $(e.target);
                        const $currentTarget = $(e.currentTarget);
                        const $firstFocusEl = $currentTarget.find(FOCUS_ELEMS).first();
                        const $lastFocusEl = $currentTarget.find(FOCUS_ELEMS).last();
                        const isTabKey = e.key === 'Tab' || e.keyCode === 9;

                        if (state.isOpenFlag) {
                            if (e.keyCode === 27) {
                                e.preventDefault();
                                method.toggle();

                                return;
                            }

                            if (e.shiftKey) {
                                if (isTabKey && $event.is($currentTarget)) {
                                    e.preventDefault();
                                    $event.find(FOCUS_ELEMS).last().focus();
                                } else if (isTabKey && $event.is($firstFocusEl)) {
                                    e.preventDefault();
                                    $lastFocusEl.focus();
                                }
                            } else if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                                if (isTabKey && $event.is($lastFocusEl)) {
                                    e.preventDefault();
                                    $firstFocusEl.focus();
                                }
                            }
                        }
                    });
                },
                destory: function () {
                    state.isRunFlag = false;
                    state.isOpenFlag = false;

                    $ctrlButton.remove();

                    if (config.createOpenButton.setting) {
                        $ctrlButton.remove();
                    }

                    if (config.createCloseButton.setting) {
                        $closeButton.off('click.' + namespace);
                    }

                    if (config.showOverlay) {
                        $root.find('#' + config.idName.overlay).remove();
                    }

                    $root.off('keydown');
                    $ctrls.removeAttr('id hidden aria-hidden aria-expanded');
                    $ctrls.find(FOCUS_ELEMS).removeAttr('tabindex');
                }
            };

            return method.init();
        };
    }());

    // フォームバリデート(研究中)
    (function () {
        $.fn.setFormValidate = function (options) {
            const t = this;
            const config = $.extend(true, {
                submitButton: 'input[type="submit"]',
                permissionControl: {
                    setting: false,
                    interLock: '' // empty => Permit when all cleared.
                },
                noEnteredAlert: {
                    setting: true,
                    alertMessage: '\u672a\u5165\u529b\u307e\u305f\u306f\u672a\u9078\u629e\u306e\u9805\u76ee\u304c\u3042\u308a\u307e\u3059\u304c\u3001\u305d\u306e\u307e\u307e\u9001\u4fe1\u3057\u3066\u3088\u308d\u3057\u3044\u3067\u3057\u3087\u3046\u304b\uff1f'
                },
                message: {
                    invalid: '\u5165\u529b\u5185\u5bb9\u304c\u6307\u5b9a\u306e\u5f62\u5f0f\u306b\u306a\u3063\u3066\u3044\u307e\u305b\u3093\u3002\n\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
                    require: '\u3053\u306e\u30a8\u30ea\u30a2\u306f\u5165\u529b\u5fc5\u9808\u3067\u3059',
                    doubleByteChara: '\u3053\u306e\u30a8\u30ea\u30a2\u306f\u300c\u5168\u89d2\u6587\u5b57\u300d\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044',
                    doubleByteKana: '\u3053\u306e\u30a8\u30ea\u30a2\u306f\u300c\u5168\u89d2\u30ab\u30bf\u30ab\u30ca\u300d\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044',
                    alphanumeric: '\u3053\u306e\u30a8\u30ea\u30a2\u306f\u300c\u534a\u89d2\u82f1\u6570\u5b57\u300d\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044',
                    number: '\u3053\u306e\u30a8\u30ea\u30a2\u306f\u300c\u534a\u89d2\u6570\u5b57\u300d\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044',
                    mail: '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u6b63\u3057\u304f\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044'
                },
                className: {
                    errorMsgWrap: 'js-error',
                    errorMsg: 'inner-error',
                    error: 'is-error'
                },
                prefix: {
                    id: 'validate-',
                    data: 'validate'
                }
            }, options);

            t.each(function () {
                $(this).data('setFormValidate', new Validate($(this), config));
            });

            return this;
        };

        const Validate = function ($root, config) {
            const namespace = 'validate';
            const formElement = 'input, select, textarea';
            const $formElements = $root.find(formElement);
            const $submit = $root.find(config.submitButton).eq(0);
            const validateId = config.prefix.id + randomString();
            let $interLockElement;

            const method = {
                init: function () {
                    let $element;

                    if (!$formElements.length || !$submit.length) {
                        $.error('Required elements are missing, please check the markup.');

                        return;
                    }

                    if (config.permissionControl.setting) {
                        $interLockElement = $root.find(config.permissionControl.interLock);

                        if ($interLockElement.length !== 0) {
                            $interLockElement.on('change keydown', function () {
                                let resultArray = [];
                                let result;
                                let $isError;
                                let $msg;

                                for (let i = 0; i < $interLockElement.length; i++) {
                                    const $interLock = $interLockElement.eq(i);

                                    resultArray.push(method.verify($interLock));
                                }

                                $isError = $root.find('.' + config.className.error);
                                $msg = $isError.siblings('.' + config.className.errorMsgWrap).find('.' + config.className.errorMsg);

                                $isError.removeClass(config.className.error);
                                $msg.empty();

                                result = resultArray.filter(function (val) {
                                    return val === false || val === 'unnecessary';
                                });

                                if (!result.length) {
                                    $submit.removeAttr('disabled aria-disabled');
                                } else {
                                    $submit.attr({
                                        disabled: '',
                                        'aria-disabled': true
                                    });
                                }
                            });

                            $interLockElement.trigger('change');
                        }
                    }

                    for (let i = 0; i < $formElements.length; i++) {
                        $element = $formElements.eq(i);

                        method.build($element);
                        method.bind.target($element);
                    }

                    method.bind.submit($submit);
                },
                build: function ($element) {
                    const $parent = $element.parent();
                    const uId = config.prefix.id + randomString();

                    $parent.after($('<span>', {
                        id: uId,
                        class: config.className.errorMsgWrap,
                        role: 'alert',
                        hidden: true,
                        'aria-hidden': true,
                        'aria-live': 'off',
                        tabindex: -1
                    }).append(
                        $('<span>', {
                            class: config.className.errorMsg
                        })
                    ));

                    $element.attr({
                        'aria-invalid': false,
                        'data-validateId': validateId
                    });

                    if ($element.data('required')) {
                        $element.attr('aria-required', 'true');
                    }
                },
                bind: {
                    target: function ($element) {
                        $element.on('focusout.' + namespace, function () {
                            const $this = $(this);

                            method.verify($this);
                        });

                        $element.on('keydown.' + namespace, function () {
                            const $this = $(this);
                            const $parent = $this.parent();

                            if ($parent.hasClass(config.className.error)) {
                                method.hideError($this);
                            }
                        });
                    },
                    submit: function ($element) {
                        $element.on('click.' + namespace, function (e) {
                            e.preventDefault();
                            method.validateAll(e);
                        });
                    }
                },
                showError: function ($element, msgText) {
                    const $parent = $element.parent();
                    const $msgWrap = $parent.siblings('.' + config.className.errorMsgWrap);
                    const $msg = $msgWrap.find('.' + config.className.errorMsg);
                    const alertId = $msgWrap.attr('id');

                    $element.attr({
                        'aria-invalid': true,
                        'aria-errormessage': alertId
                    });
                    $msgWrap.attr({
                        hidden: false,
                        'aria-hidden': false,
                        'aria-live': 'assertive'
                    });
                    $parent.addClass(config.className.error);
                    $msg.text(msgText);
                },
                hideError: function ($element) {
                    const $parent = $element.parent();
                    const $msgWrap = $parent.siblings('.' + config.className.errorMsgWrap);
                    const $msg = $msgWrap.find('.' + config.className.errorMsg);

                    $element.attr('aria-invalid', 'false').removeAttr('aria-errormessage');
                    $msgWrap.attr({
                        hidden: true,
                        'aria-hidden': true,
                        'aria-live': 'off'
                    });
                    $parent.removeClass(config.className.error);
                    $msg.empty();
                },
                check: function () {
                    // ここで本当にバリデーションの必要があるのか検証(type="hidden"とかreadonlyとかを除外する)
                },
                verify: function ($element) {
                    const value = $element.val();
                    const elementType = $element.attr('type');
                    const validateType = $element.data('validatetype');
                    const isRequired = $element.data('required');
                    let $sameNameInput;
                    let $checkedElements;
                    let elementName;
                    let result;
                    let msgText;

                    if (elementType === 'radio' || elementType === 'checkbox') {
                        elementName = $element.attr('name');

                        $sameNameInput = $('input[name="' + elementName + '"]');
                        $checkedElements = $sameNameInput.filter(function () {
                            return $(this).is(':checked');
                        });

                        if (!$checkedElements.length && isRequired) {
                            msgText = config.message.require;
                            method.showError($sameNameInput.eq(0), msgText, elementType);

                            return false;
                        } else if (!$checkedElements.length && !isRequired) {
                            return 'unnecessary';
                        }

                        return true;
                    }

                    if (validateType) {
                        result = method.validate[validateType](value);

                        if (value === '' && !isRequired) {
                            return 'unnecessary';
                        }

                        if (!result) {
                            msgText = value === '' ? config.message.require : config.message[validateType];
                            method.showError($element, msgText, elementType);
                        } else {
                            method.hideError($element);
                        }

                        return result;
                    }

                    return 'unnecessary';
                },
                validate: {
                    doubleByteChara: function (str) {
                        return /^[ぁ-んァ-ヶー一-龠々 　\t]+$/.test(str);
                    },
                    doubleByteKana: function (str) {
                        return /^[\u30a0-\u30ff]+$/.test(str);
                    },
                    alphanumeric: function (str) {
                        return /^[0-9a-zA-Z]+$/.test(str);
                    },
                    number: function (num) {
                        return !isNaN(parseInt(num, 10)) && !isNaN(Number(num));
                    },
                    mail: function (str) {
                        return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(str);
                    }
                },
                validateAll: function (e) {
                    const $validateTargets = $root.find('[data-validateId="' + validateId + '"]');
                    let $validateTarget;
                    let resultArray = [];

                    for (let i = 0; i < $validateTargets.length; i++) {
                        $validateTarget = $validateTargets.eq(i);

                        resultArray.push(method.verify($validateTarget));
                    }

                    if ($.inArray(false, resultArray) !== -1) {
                        win.alert(config.message.invalid);
                        e.stopImmediatePropagation();
                    } else {
                        $.each(resultArray, function (idx) {
                            const result = resultArray[idx];
                            let $sameNameInput;
                            let type;
                            let value;
                            let elementName;
                            let res;

                            if (result === 'unnecessary') {
                                value = $validateTargets.eq(idx).val();
                                type = $validateTargets.eq(idx).attr('type');

                                if (type === 'radio' || type === 'checkbox') {
                                    elementName = $validateTargets.eq(idx).attr('name');
                                    $sameNameInput = $('input[name="' + elementName + '"]');
                                    if (!$sameNameInput.prop('checked')) {
                                        res = win.confirm(config.noEnteredAlert.alertMessage);

                                        if (!res) {
                                            e.stopImmediatePropagation();
                                        }

                                        return false;
                                    }
                                }

                                if (value === '') {
                                    res = win.confirm(config.noEnteredAlert.alertMessage);

                                    if (!res) {
                                        e.stopImmediatePropagation();
                                    }

                                    return false;
                                }
                            }
                        });
                    }
                }
            };

            return method.init();
        };
    }());

    // メール送信(研究中)
    (function () {
        $.fn.sendMail = function (options) {
            const t = this;
            const config = $.extend(true, {
                sendTo: 'http://sasa.sub.jp/php/mailer.php',
                formRoot: '#js-sendMail',
                message: {
                    success: '\u9001\u4fe1\u304c\u6210\u529f\u3057\u307e\u3057\u305f\uff01',
                    failed: '\u4f55\u3089\u304b\u306e\u539f\u56e0\u3067\u9001\u4fe1\u304c\u5931\u6557\u3057\u307e\u3057\u305f\u2026',
                    notExpected: '\u4e88\u671f\u305b\u306c\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f',
                    serverError: '\u30b5\u30fc\u30d0\u30fc\u4e0a\u3067\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f\u3002\u6642\u9593\u3092\u304a\u3044\u3066\u304b\u3089\u9001\u4fe1\u304f\u3060\u3055\u3044\u3002',
                    invalid: '\u4e0d\u6b63\u306a\u5165\u529b\u5024\u3092\u691c\u51fa\u3057\u307e\u3057\u305f',
                    empty: '\u5165\u529b\u5fc5\u9808\u9805\u76ee\u304c\u7a7a\u306e\u307e\u307e\u9001\u4fe1\u3055\u308c\u307e\u3057\u305f',
                    processing: '\u51e6\u7406\u4e2d\u3067\u3059\u3002\u3057\u3070\u3089\u304f\u304a\u5f85\u3061\u304f\u3060\u3055\u3044\u3002',
                    complete: '\u9001\u4fe1\u304c\u5b8c\u4e86\u3057\u3066\u3044\u307e\u3059\u3002\n\u518d\u5ea6\u9001\u4fe1\u3059\u308b\u306b\u306f\u30da\u30fc\u30b8\u3092\u518d\u8aad\u307f\u8fbc\u307f\u3057\u3066\u304f\u3060\u3055\u3044',
                    nothing: '\u672a\u5165\u529b'
                },
                className: {
                    stateMsgWrap: 'js-state',
                    stateMsg: 'inner-state',
                    error: 'is-failed',
                    success: 'is-success'
                },
                prefix: {
                    id: 'sendmail-',
                    data: 'sendmail'
                }
            }, options);

            t.each(function () {
                $(this).data('sendMail', new Mail($(this), config));
            });

            return this;
        };

        const Mail = function ($root, config) {
            const namespace = 'mail';
            const formElement = 'input, select, textarea';
            const $formRoot = $root.closest(config.formRoot);
            const $formElement = $formRoot.find(formElement);
            const uId = config.prefix.id + randomString();
            let dataArray = [];
            let state = {
                isSendingFlag: false,
                isSentFlag: false
            };

            const method = {
                init: function () {
                    $formRoot.append($('<div>', {
                        id: uId,
                        class: config.className.stateMsgWrap,
                        role: 'status',
                        hidden: true,
                        'aria-hidden': true,
                        'aria-live': 'polive',
                        tabindex: -1
                    }).append(
                        $('<span>', {
                            class: config.className.stateMsg
                        })
                    ));

                    method.bind();
                    method.initState();
                },
                bind: function () {
                    $root.on('click.' + namespace, function (e) {
                        e.preventDefault();

                        if (!state.isSendingFlag && !state.isSentFlag) {
                            method.sendData(method.getSendData());
                        } else if (state.isSendingFlag && !state.isSentFlag){
                            win.alert(config.message.processing);
                        } else {
                            win.alert(config.message.complete);
                        }

                        return false;
                    });
                },
                initState: function () {
                    for (let i = 0; i < $formElement.length; i++) {
                        const $element = $formElement.eq(i);

                        dataArray.push([
                            $element.attr('name'),
                            Boolean($element.data('required')),
                            $element.data('validatetype')
                        ]);
                    }
                },
                getSendData: function () {
                    for (let i = 0; i < $formElement.length; i++) {
                        dataArray[i].push(method.getFormValue($formElement.eq(i)));
                    }

                    return dataArray;
                },
                getFormValue: function ($element) {
                    const elementType = $element.attr('type');
                    const elementName = $element.attr('name');
                    let $sameNameInput;
                    let $checkedElements;
                    let value;

                    if (elementType === 'radio' || elementType === 'checkbox') {
                        $sameNameInput = $('input[name="' + elementName + '"]');

                        $checkedElements = $sameNameInput.filter(function () {
                            return $(this).is(':checked');
                        });

                        if (!$checkedElements.length) {
                            value = config.message.nothing;
                        } else {
                            value = $checkedElements.closest('label').text();
                        }
                    } else if ($element.is('select')) {
                        if ($element.val() !== '') {
                            value = $element.find('option:selected').text();
                        } else {
                            value = config.message.nothing;
                        }
                    } else {
                        value = $element.val();
                    }

                    return value;
                },
                sendData: function (data) {
                    state.isSendingFlag = true;

                    $.ajax({
                        type: 'POST',
                        url: config.sendTo,
                        dataType: 'html',
                        data: {postData: JSON.stringify(data)}
                    }).done(function (res) {
                        state.isSentFlag = true;
                        console.log(res);
                        method.updateState(res);
                    }).fail(function () {
                        state.isSentFlag = true;
                        method.updateState('serverError');
                    });

                    for (let i = 0; i < dataArray.length; i++) {
                        dataArray[i].pop();
                    }
                },
                updateState: function (res) {
                    const $stateMsgWrap = $formRoot.find('#' + uId);
                    const stateMsg = res !== '' ? config.message[res] : config.message.notExpected;
                    const resType = res === 'success' ? config.className.success : config.className.error;

                    $root.attr('aria-describedby', $stateMsgWrap.attr('id'));
                    $stateMsgWrap.find('.' + config.className.stateMsg).text(stateMsg);
                    $stateMsgWrap.attr({
                        hidden: false,
                        'aria-hidden': false,
                    }).addClass(resType);
                }
            };

            return method.init();
        };
    }());
}(this, this.document, this.jQuery, (function (win) {
    const $ = win.jQuery;
    const $win = $(win);
    const BREAK_POINT = '769px';
    const mql = win.matchMedia('(min-width: ' + BREAK_POINT + ')');
    const isMatchMedia = function () {
        mql.state = mql.matches ? 'PC' : 'SP';
        $win.trigger('onMachMedia');
    };

    mql.addListener(function () {
        isMatchMedia();
    });

    isMatchMedia();

    return mql;
}(this))));
