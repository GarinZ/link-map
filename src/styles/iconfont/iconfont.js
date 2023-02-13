(window._iconfont_svg_string_3889192 =
    '<svg><symbol id="icon-minus_square" viewBox="0 0 1024 1024"><path d="M252.068571 906.496h520.283429c89.581714 0 134.144-44.562286 134.144-132.845714V250.331429c0-88.283429-44.562286-132.845714-134.144-132.845715H252.068571c-89.142857 0-134.582857 44.141714-134.582857 132.845715V773.668571c0 88.704 45.44 132.845714 134.582857 132.845715z m1.28-68.992c-42.843429 0-66.852571-22.710857-66.852571-67.291429V253.805714c0-44.580571 24.009143-67.291429 66.852571-67.291428h517.723429c42.422857 0 66.432 22.710857 66.432 67.291428V770.194286c0 44.580571-24.009143 67.291429-66.432 67.291428z m86.582858-289.718857h344.576c23.990857 0 40.704-12.854857 40.704-35.565714 0-23.149714-15.433143-36.425143-40.704-36.425143H339.931429c-24.868571 0-40.722286 13.275429-40.722286 36.425143 0 22.710857 16.713143 35.565714 40.722286 35.565714z"  ></path></symbol><symbol id="icon-plus_square" viewBox="0 0 1024 1024"><path d="M252.068571 906.496h520.283429c89.581714 0 134.144-44.562286 134.144-132.845714V250.331429c0-88.283429-44.562286-132.845714-134.144-132.845715H252.068571c-89.142857 0-134.582857 44.141714-134.582857 132.845715V773.668571c0 88.704 45.44 132.845714 134.582857 132.845715z m1.28-68.992c-42.843429 0-66.852571-22.710857-66.852571-67.291429V253.805714c0-44.580571 24.009143-67.291429 66.852571-67.291428h517.723429c42.422857 0 66.432 22.710857 66.432 67.291428V770.194286c0 44.580571-24.009143 67.291429-66.432 67.291428z m258.432-123.008c22.710857 0 36.425143-15.853714 36.425143-40.704v-126.427429h134.144c24.009143 0 40.722286-12.873143 40.722286-35.584 0-23.131429-15.853714-36.425143-40.722286-36.425142H548.205714v-134.582858c0-24.850286-13.714286-40.704-36.425143-40.704s-35.565714 16.713143-35.565714 40.722286v134.582857H342.491429c-24.850286 0-41.142857 13.275429-41.142858 36.406857 0 22.710857 17.152 35.584 41.142858 35.584h133.723428v126.427429c0 23.990857 12.854857 40.704 35.565714 40.704z"  ></path></symbol></svg>'),
    (function (n) {
        var t = (t = document.getElementsByTagName('script'))[t.length - 1],
            e = t.getAttribute('data-injectcss'),
            t = t.getAttribute('data-disable-injectsvg');
        if (!t) {
            var c,
                o,
                i,
                s,
                d,
                a = function (t, e) {
                    e.parentNode.insertBefore(t, e);
                };
            if (e && !n.__iconfont__svg__cssinject__) {
                n.__iconfont__svg__cssinject__ = !0;
                try {
                    document.write(
                        '<style>.svgfont {display: inline-block;width: 1em;height: 1em;fill: currentColor;vertical-align: -0.1em;font-size:16px;}</style>',
                    );
                } catch (t) {
                    console && console.log(t);
                }
            }
            (c = function () {
                var t,
                    e = document.createElement('div');
                (e.innerHTML = n._iconfont_svg_string_3889192),
                    (e = e.getElementsByTagName('svg')[0]) &&
                        (e.setAttribute('aria-hidden', 'true'),
                        (e.style.position = 'absolute'),
                        (e.style.width = 0),
                        (e.style.height = 0),
                        (e.style.overflow = 'hidden'),
                        (e = e),
                        (t = document.body).firstChild ? a(e, t.firstChild) : t.appendChild(e));
            }),
                document.addEventListener
                    ? ~['complete', 'loaded', 'interactive'].indexOf(document.readyState)
                        ? setTimeout(c, 0)
                        : ((o = function () {
                              document.removeEventListener('DOMContentLoaded', o, !1), c();
                          }),
                          document.addEventListener('DOMContentLoaded', o, !1))
                    : document.attachEvent &&
                      ((i = c),
                      (s = n.document),
                      (d = !1),
                      r(),
                      (s.onreadystatechange = function () {
                          'complete' == s.readyState && ((s.onreadystatechange = null), l());
                      }));
        }
        function l() {
            d || ((d = !0), i());
        }
        function r() {
            try {
                s.documentElement.doScroll('left');
            } catch (t) {
                return void setTimeout(r, 50);
            }
            l();
        }
    })(window);
