(function ($) {
    "use strict";

    class jTOC {
        constructor(dom, options) {
            this.$dom = $(dom);
            this.opts = $.extend(this.getDefaultOptions(), options);
            this.currentLevel = 0;
            this.headingSelectors = this.opts.headings.split(",");
            this.stack = [this.$dom];
            this.listTag = dom.tagName;
            this.init();
        }

        getDefaultOptions() {
            return {
                content: "body",
                headings: "h1,h2,h3",
                anchorPrefix: "",
                scrollEnabled: true,
                scrollSpeed: 400,
                scrollEase: "swing",
                scrollEl: "body,html",
                scrollOffset: 0
            };
        }

        init() {
            this.parseContent();
            this.$dom.trigger("jTocBuilt");
        }

        parseContent() {
            const self = this;
            $(self.opts.content).find(self.opts.headings).each(function () {
                const $el = $(this);
                const level = self.getHeadingLevel($el);

                const anchorName = self.generateAnchorName($el);
                self.addAnchorIfNeeded($el, anchorName);

                self.updateStack(level);

                const $a = self.buildTOCLink($el, anchorName, level);
                $("<li/>").appendTo(self.stack[0]).append($a);

                self.currentLevel = level;
            });
        }

        getHeadingLevel($el) {
            return $.map(this.headingSelectors, (selector, index) => $el.is(selector) ? index : undefined)[0];
        }

        generateAnchorName($el) {
            return this.opts.anchorPrefix + $el.text().replace(/^[^A-Za-z]*/, "").replace(/[^A-Za-z0-9]+/g, "_");
        }

        addAnchorIfNeeded($el, anchorName) {
            if ($el.attr("id") !== anchorName) {
                $("<span/>").attr("id", anchorName).insertBefore($el);
            }
        }

        updateStack(level) {
            if (level > this.currentLevel) {
                const parentItem = this.stack[0].children("li:last")[0];
                if (parentItem) {
                    this.stack.unshift($("<" + this.listTag + "/>").appendTo(parentItem));
                }
            } else {
                this.stack.splice(0, Math.min(this.currentLevel - level, Math.max(this.stack.length - 1, 0)));
            }
        }

        buildTOCLink($el, anchorName, level) {
            return $("<a/>")
                .text($el.text())
                .attr("href", "#" + anchorName)
                .addClass(`toc-link toc-link--level-${level}`)
                .on("click", (e) => {
                    if (this.opts.scrollEnabled) {
                        e.preventDefault();
                        this.scrollTo("#" + anchorName);
                    }
                    $el.trigger("selected", $(this).attr("href"));
                    $(this).blur();
                });
        }

        scrollTo(selector) {
            const $el = $(selector);
            $(this.opts.scrollEl).animate({
                scrollTop: $el.offset().top - $(this.opts.scrollEl).offset().top - this.opts.scrollOffset
            }, this.opts.scrollSpeed, this.opts.scrollEase, () => {
                const hash = $el.attr("id");
                if (hash.length) {
                    if (history.pushState) {
                        history.pushState(null, null, "#" + hash);
                    } else {
                        document.location.hash = hash;
                    }
                }
                $el.trigger("scrollComplete");
            });
        }
    }

    $.fn.jtoc = function (options) {
        return this.each(function () {
            new jTOC(this, options);
        });
    };

})(jQuery);
