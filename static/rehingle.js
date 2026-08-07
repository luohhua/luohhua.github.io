/* ----

# ReHingle Theme
# By: Dreamer-Paul
# Last Update: 2024.9.2

一个简洁大气，含夜间模式的 Hexo 博客模板。

本代码为奇趣保罗原创，并遵守 MIT 开源协议。欢迎访问我的博客：https://paugram.com

---- */

var Paul_ReHingle = function (config) {
    var body = document.body;
    var content = ks.select(".post-content:not(.is-special), .page-content:not(.is-special)");

    // 菜单按钮
    this.header = function () {
        var menu = document.getElementsByClassName("head-menu")[0];

        ks.select(".toggle-btn").onclick = function () {
            menu.classList.toggle("active");
        };

        ks.select(".light-btn").onclick = this.night;

        var search = document.getElementsByClassName("search-btn")[0];
        var bar = document.getElementsByClassName("head-search")[0];

        search.addEventListener("click", function () {
            bar.classList.toggle("active");
        })
    };

    // 关灯切换
    this.night = function () {
        if(body.classList.contains("dark-theme")){
            body.classList.remove("dark-theme");
            localStorage.setItem("rehingle-night", "false");
        }
        else{
            body.classList.add("dark-theme");
            localStorage.setItem("rehingle-night", "true");
        }
    };

    // 目录树
    this.tree = function () {
        if (document.querySelector(".no-trees")) {
            return;
        }

        const wrap = ks.select(".wrap");
        const headings = content.querySelectorAll("h1, h2, h3, h4, h5, h6");

        if (headings.length === 0) {
            return;
        }

        body.classList.add("has-trees");

        // 计算数量，得出最高层级
        const levelCount = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };

        headings.forEach((el) => {
            const tagName = el.tagName.toLowerCase();
            levelCount[tagName]++;
        });

        let firstLevel = 1;
        if (levelCount.h1 === 0 && levelCount.h2 > 0) {
            firstLevel = 2;
        }
        else if (levelCount.h1 === 0 && levelCount.h2 === 0 && levelCount.h3 > 0) {
            firstLevel = 3;
        }

        // 目录树节点
        const trees = ks.create("section", {
            class: "article-list",
            html: `<h4><span class="title">目录</span></h4>`
        });

        ks.each(headings, (t, index) => {
            const text = t.innerText;

            t.id = "title-" + index;

            const level = Number(t.tagName.substring(1)) - firstLevel + 1;
            const className = `item-${level}`;

            trees.appendChild(ks.create("a", {
                class: className,
                text,
                href: `#title-${index}`,
                attr: [
                    {name: "data-id", value: "title-" + index},
                ],
            }));
        });

        wrap.appendChild(trees);

        // 滚动时高亮当前章节
        const tocLinks = trees.querySelectorAll("a");

        const updateActive = function () {
            const offset = 120;
            let current = null;

            ks.each(headings, (h, i) => {
                if (h.getBoundingClientRect().top <= offset) {
                    current = i;
                }
            });

            if (current === null && headings.length > 0) {
                current = 0;
            }

            ks.each(tocLinks, function (link, i) {
                link.classList.toggle("active", i === current);
            });
        };

        window.addEventListener("scroll", updateActive, { passive: true });
        updateActive();

        // 绑定元素
        const buttons = ks.select("footer .buttons");
        const btn = ks.create("button", {
            class: "toggle-list",
            attr: [
                {name: "title", value: "切换文章目录"},
            ],
        });
        buttons.appendChild(btn);

        btn.addEventListener("click", () => {
            trees.classList.toggle("active");
        });
    };

    // 自动添加外链
    this.links = function () {
        var l = content.getElementsByTagName("a");

        if(l){
            ks.each(l, function (t) {
                t.target = "_blank";
            });
        }
    };

    this.comment_list = function () {
        ks(".comment-content [href^='#comment']").each(function (t) {
            var item = ks.select(t.getAttribute("href"));

            t.onmouseover = function () {
                item.classList.add("active");
            };

            t.onmouseout = function () {
                item.classList.remove("active");
            };
        });
    };

    // 返回页首
    this.to_top = function () {
        var btn = document.getElementsByClassName("to-top")[0];
        var scroll = document.documentElement.scrollTop || document.body.scrollTop;

        scroll >= window.innerHeight / 2 ? btn.classList.add("active") : btn.classList.remove("active");
    };

    // 星空/粒子背景
    this.starfield = function () {
        var canvas = document.getElementById("starfield");

        if (!canvas || !config.starfield || !config.starfield.enable) {
            if (canvas) canvas.remove();
            return;
        }

        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            canvas.remove();
            return;
        }

        var ctx = canvas.getContext("2d");
        var density = config.starfield.density || 0.00012;
        var stars = [];
        var particles = [];
        var rafId = null;
        var running = true;

        var resize = function () {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            var count = Math.min(180, Math.floor(canvas.width * canvas.height * density));
            stars = [];
            particles = [];

            for (var i = 0; i < count; i++) {
                var isParticle = i % 12 === 0;
                var base = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: isParticle ? 1.5 + Math.random() * 2 : Math.random() * 1.6 + .6,
                    a: Math.random() * .6 + .45
                };

                if (isParticle) {
                    base.vx = (Math.random() - .5) * .25;
                    base.vy = (Math.random() - .5) * .25;
                    particles.push(base);
                }
                else {
                    base.twinkle = Math.random() * Math.PI * 2;
                    base.speed = Math.random() * .02 + .005;
                    stars.push(base);
                }
            }
        };

        var draw = function () {
            if (!running) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 星星闪烁
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                s.twinkle += s.speed;
                ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(s.twinkle));
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // 粒子漂浮 + 连线
            for (var j = 0; j < particles.length; j++) {
                var p = particles[j];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.globalAlpha = p.a;
                ctx.fillStyle = "#9fcff7";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // 粒子间连线
            ctx.globalAlpha = .12;
            ctx.strokeStyle = "#9fcff7";
            ctx.lineWidth = 1;
            for (var m = 0; m < particles.length; m++) {
                for (var n = m + 1; n < particles.length; n++) {
                    var dx = particles[m].x - particles[n].x;
                    var dy = particles[m].y - particles[n].y;
                    var dist = dx * dx + dy * dy;
                    if (dist < 120 * 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[m].x, particles[m].y);
                        ctx.lineTo(particles[n].x, particles[n].y);
                        ctx.stroke();
                    }
                }
            }

            ctx.globalAlpha = 1;
            rafId = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener("resize", resize);
        draw();

        // 页面不可见时暂停，省性能
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                running = false;
                if (rafId) cancelAnimationFrame(rafId);
            }
            else if (!running) {
                running = true;
                draw();
            }
        });
    };

    this.header();

    if(content){
        this.tree();
        this.links();
        this.comment_list();
    }

    this.starfield();

    // 返回页首
    window.addEventListener("scroll", this.to_top);

    // 夜间模式：手动选择优先（localStorage 持久化，刷新不掉），否则跟随系统
    var saved = localStorage.getItem("rehingle-night");

    if (saved === "true") {
        body.classList.add("dark-theme");
    }
    else if (saved === "false") {
        body.classList.remove("dark-theme");
    }
    else if (config.night && window.matchMedia) {
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        body.classList.toggle("dark-theme", prefersDark);
    }

    // 如果开启复制内容提示
    if(config.copyright){
        document.oncopy = function () {
            ks.notice("复制内容请注明来源并保留版权信息！", {color: "yellow", overlay: true})
        };
    }

    //
    // ! Hexo 特别功能
    //

    // 本地搜索
    this.hexo_search = function () {
        var form = ks.select(".head-search"), input = ks.select(".head-search input");
        var wrap = form.querySelector(".search-results");
        var data;

        try { data = JSON.parse(document.getElementById("search-data").textContent); } catch(e){ return }

        form.onsubmit = function (ev) { ev.preventDefault() };

        input.addEventListener("input", function () {
            var q = input.value.trim().toLowerCase();
            if(!q || q.length < 2){ wrap.innerHTML = ""; wrap.classList.remove("active"); return }

            var matched = data.filter(function (p) {
                var tagMatch = p.tags && p.tags.some(function(t){ return t.toLowerCase().indexOf(q) !== -1 });
                var catMatch = p.categories && p.categories.some(function(c){ return c.toLowerCase().indexOf(q) !== -1 });
                var contentMatch = p.content && p.content.toLowerCase().indexOf(q) !== -1;
                return p.title.toLowerCase().indexOf(q) !== -1 ||
                       (p.excerpt && p.excerpt.toLowerCase().indexOf(q) !== -1) ||
                       contentMatch || tagMatch || catMatch;
            }).slice(0, 8);

            if(!matched.length){ wrap.innerHTML = ""; wrap.classList.remove("active"); return }

            wrap.classList.add("active");
            wrap.innerHTML = matched.map(function (p) {
                return '<a href="' + p.path + '">' + p.title + '</a>';
            }).join("");
        });

        document.addEventListener("click", function (e) {
            if(!form.contains(e.target)){ wrap.classList.remove("active") }
        });
    }

    this.hexo_search();
};

// 图片缩放
ks.image(".post-content:not(.is-special) img, .page-content:not(.is-special) img");

// 图片懒加载：优先使用原生 loading="lazy"，无 ks-* 占位属性的图片统一处理
(function () {
    var images = document.querySelectorAll(".post-content:not(.is-special) img, .page-content:not(.is-special) img");

    ks.each(images, function (img) {
        if (img.getAttribute("ks-original") || img.getAttribute("ks-thumb")) {
            return; // 交由 Kico Style 的懒加载机制处理
        }

        if (!img.hasAttribute("loading")) {
            img.setAttribute("loading", "lazy");
        }

        if (!img.hasAttribute("decoding")) {
            img.setAttribute("decoding", "async");
        }
    });
})();

// 代码块一键复制
(function () {
    var blocks = document.querySelectorAll(".post-content pre, .page-content pre");

    ks.each(blocks, function (pre) {
        var btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.type = "button";
        btn.title = "复制代码";

        var copyText = function () {
            var code = pre.querySelector("code");
            var text = code ? code.innerText : pre.innerText;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, fallback);
            }
            else {
                fallback();
            }

            function fallback() {
                var area = document.createElement("textarea");
                area.value = text;
                document.body.appendChild(area);
                area.select();
                try {
                    document.execCommand("copy");
                    done();
                }
                catch (err) {}
                document.body.removeChild(area);
            }

            function done() {
                btn.classList.add("copied");
                setTimeout(function () {
                    btn.classList.remove("copied");
                }, 1500);
            }
        };

        btn.addEventListener("click", copyText);
        pre.appendChild(btn);
    });
})();

// 图片加载动画：加载完成后淡入
(function () {
    var images = document.querySelectorAll(".post-content:not(.is-special) img, .page-content:not(.is-special) img");

    ks.each(images, function (img) {
        img.classList.add("img-loading");

        var reveal = function () {
            img.classList.add("img-loaded");
        };

        if (img.complete && img.naturalWidth > 0) {
            reveal();
        }
        else {
            img.addEventListener("load", reveal);
            img.addEventListener("error", reveal);
        }
    });
})();

// 阅读进度条
(function () {
    var bar = document.getElementById("reading-bar");

    if (!bar) {
        return;
    }

    var update = function () {
        var doc = document.documentElement;
        var total = doc.scrollHeight - window.innerHeight;
        var ratio = total > 0 ? window.scrollY / total : 0;
        bar.style.width = (ratio * 100) + "%";
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
})();

// 复制文章链接
(function () {
    var btn = document.querySelector(".copy-link");

    if (!btn) {
        return;
    }

    var done = function () {
        btn.classList.add("copied");
        btn.innerHTML = '<i class="fa fa-check"></i> 已复制';
        setTimeout(function () {
            btn.classList.remove("copied");
            btn.innerHTML = '<i class="fa fa-link"></i> 点击复制';
        }, 1500);
    };

    var fallback = function () {
        var area = document.createElement("textarea");
        area.value = window.location.href;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        area.setSelectionRange(0, area.value.length);

        var ok = false;
        try {
            ok = document.execCommand("copy");
        }
        catch (err) {}
        document.body.removeChild(area);

        if (ok) {
            done();
        }
    };

    btn.addEventListener("click", function (e) {
        e.preventDefault();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href).then(done).catch(fallback);
        }
        else {
            fallback();
        }
    });
})();

// pangu 排版：中英文之间自动加空格
(function () {
    var containers = document.querySelectorAll(".post-content:not(.is-special), .page-content:not(.is-special)");

    ks.each(containers, function (container) {
        var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                var parent = node.parentElement;
                if (parent && /^(PRE|CODE|SCRIPT|STYLE|KBD|SAMP)$/.test(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var node;
        while ((node = walker.nextNode())) {
            var text = node.nodeValue;
            var spaced = text
                .replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, "$1 $2")
                .replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, "$1 $2");

            if (spaced !== text) {
                node.nodeValue = spaced;
            }
        }
    });
})();

// 请保留版权说明
if(window.console && window.console.log){
    console.log("%c ReHingle %c https://github.com/luohhua/hexo-theme-rehingle ","color: #fff; margin: 1em 0; padding: 5px 0; background: #6f9fc7;","margin: 1em 0; padding: 5px 0; background: #efefef;");
}
