/*!
 * Copyright (c) 2011 Simo Kinnunen.
 * Licensed under the MIT license.
 *
 * @version ${Version}
 */

var Cufon = (function() {

	var api = {};

	var DOM = api.DOM = {

		ready: (function() {

			var complete = false, readyStatus = { loaded: 1, complete: 1 };

			var queue = [], perform = function() {
				if (complete) return;
				complete = true;
				for (var fn; fn = queue.shift(); fn());
			};

			// Gecko, Opera, WebKit r26101+

			if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', perform, false);
				window.addEventListener('pageshow', perform, false); // For cached Gecko pages
			}

			// Old WebKit, Internet Explorer

			if (!window.opera && document.readyState) (function() {
				readyStatus[document.readyState] ? perform() : setTimeout(arguments.callee, 10);
			})();

			// Internet Explorer

			if (document.readyState && document.createStyleSheet) (function() {
				try {
					document.body.doScroll('left');
					perform();
				}
				catch (e) {
					setTimeout(arguments.callee, 1);
				}
			})();

			return function(listener) {
				if (!arguments.length) perform();
				else complete ? listener() : queue.push(listener);
			};

		})(),

		root: function() {
			return document.documentElement || document.body;
		},

		strict: (function() {
			var doctype;
			// no doctype (doesn't always catch it though.. IE I'm looking at you)
			if (document.compatMode == 'BackCompat') return false;
			// WebKit, Gecko, Opera, IE9+
			doctype = document.doctype;
			if (doctype) {
				return !/frameset|transitional/i.test(doctype.publicId);
			}
			// IE<9, firstChild is the doctype even if there's an XML declaration
			doctype = document.firstChild;
			if (doctype.nodeType != 8 || /^DOCTYPE.+(transitional|frameset)/i.test(doctype.data)) {
				return false;
			}
			return true;
		})()

	};

	var CSS = api.CSS = {

		Size: function(value, base) {

			this.value = parseFloat(value);
			this.unit = String(value).match(/[a-z%]*$/)[0] || 'px';

			this.convert = function(value) {
				return value / base * this.value;
			};

			this.convertFrom = function(value) {
				return value / this.value * base;
			};

			this.toString = function() {
				return this.value + this.unit;
			};

		},

		addClass: function(el, className) {
			var current = el.className;
			el.className = current + (current && ' ') + className;
			return el;
		},

		color: cached(function(value) {
			var parsed = {};
			parsed.color = value.replace(/^rgba\((.*?),\s*([\d.]+)\)/, function($0, $1, $2) {
				parsed.opacity = parseFloat($2);
				return 'rgb(' + $1 + ')';
			});
			return parsed;
		}),

		// has no direct CSS equivalent.
		// @see http://msdn.microsoft.com/en-us/library/system.windows.fontstretches.aspx
		fontStretch: cached(function(value) {
			if (typeof value == 'number') return value;
			if (/%$/.test(value)) return parseFloat(value) / 100;
			return {
				'ultra-condensed': 0.5,
				'extra-condensed': 0.625,
				condensed: 0.75,
				'semi-condensed': 0.875,
				'semi-expanded': 1.125,
				expanded: 1.25,
				'extra-expanded': 1.5,
				'ultra-expanded': 2
			}[value] || 1;
		}),

		getStyle: function(el) {
			var view = document.defaultView;
			if (view && view.getComputedStyle) return new Style(view.getComputedStyle(el, null));
			if (el.currentStyle) return new Style(el.currentStyle);
			return new Style(el.style);
		},

		gradient: cached(function(value) {
			var gradient = {
				id: value,
				type: value.match(/^-([a-z]+)-gradient\(/)[1],
				stops: []
			}, colors = value.substr(value.indexOf('(')).match(/([\d.]+=)?(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)/ig);
			for (var i = 0, l = colors.length, stop; i < l; ++i) {
				stop = colors[i].split('=', 2).reverse();
				gradient.stops.push([ stop[1] || i / (l - 1), stop[0] ]);
			}
			return gradient;
		}),

		quotedList: cached(function(value) {
			// doesn't work properly with empty quoted strings (""), but
			// it's not worth the extra code.
			var list = [], re = /\s*((["'])([\s\S]*?[^\\])\2|[^,]+)\s*/g, match;
			while (match = re.exec(value)) list.push(match[3] || match[1]);
			return list;
		}),

		recognizesMedia: cached(function(media) {
			var el = document.createElement('style'), sheet, container, supported;
			el.type = 'text/css';
			el.media = media;
			try { // this is cached anyway
				el.appendChild(document.createTextNode('/**/'));
			} catch (e) {}
			container = elementsByTagName('head')[0];
			container.insertBefore(el, container.firstChild);
			sheet = (el.sheet || el.styleSheet);
			supported = sheet && !sheet.disabled;
			container.removeChild(el);
			return supported;
		}),

		removeClass: function(el, className) {
			var re = RegExp('(?:^|\\s+)' + className +  '(?=\\s|$)', 'g');
			el.className = el.className.replace(re, '');
			return el;
		},

		supports: function(property, value) {
			var checker = document.createElement('span').style;
			if (checker[property] === undefined) return false;
			checker[property] = value;
			return checker[property] === value;
		},

		textAlign: function(word, style, position, wordCount) {
			if (style.get('textAlign') == 'right') {
				if (position > 0) word = ' ' + word;
			}
			else if (position < wordCount - 1) word += ' ';
			return word;
		},

		textShadow: cached(function(value) {
			if (value == 'none') return null;
			var shadows = [], currentShadow = {}, result, offCount = 0;
			var re = /(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)|(-?[\d.]+[a-z%]*)|,/ig;
			while (result = re.exec(value)) {
				if (result[0] == ',') {
					shadows.push(currentShadow);
					currentShadow = {};
					offCount = 0;
				}
				else if (result[1]) {
					currentShadow.color = result[1];
				}
				else {
					currentShadow[[ 'offX', 'offY', 'blur' ][offCount++]] = result[2];
				}
			}
			shadows.push(currentShadow);
			return shadows;
		}),

		textTransform: (function() {
			var map = {
				uppercase: function(s) {
					return s.toUpperCase();
				},
				lowercase: function(s) {
					return s.toLowerCase();
				},
				capitalize: function(s) {
					return s.replace(/(?:^|\s)./g, function($0) {
						return $0.toUpperCase();
					});
				}
			};
			return function(text, style) {
				var transform = map[style.get('textTransform')];
				return transform ? transform(text) : text;
			};
		})(),

		whiteSpace: (function() {
			var ignore = {
				inline: 1,
				'inline-block': 1,
				'run-in': 1
			};
			var wsStart = /^\s+/, wsEnd = /\s+$/;
			return function(text, style, node, previousElement, simple) {
				if (simple) return text.replace(wsStart, '').replace(wsEnd, ''); // @fixme too simple
				if (previousElement) {
					if (previousElement.nodeName.toLowerCase() == 'br') {
						text = text.replace(wsStart, '');
					}
				}
				if (ignore[style.get('display')]) return text;
				if (!node.previousSibling) text = text.replace(wsStart, '');
				if (!node.nextSibling) text = text.replace(wsEnd, '');
				return text;
			};
		})()

	};

	CSS.ready = (function() {

		// don't do anything in Safari 2 (it doesn't recognize any media type)
		var complete = !CSS.recognizesMedia('all'), hasLayout = false;

		var queue = [], perform = function() {
			complete = true;
			for (var fn; fn = queue.shift(); fn());
		};

		var links = elementsByTagName('link'), styles = elementsByTagName('style');

		var checkTypes = {
			'': 1,
			'text/css': 1
		};

		function isContainerReady(el) {
			if (!checkTypes[el.type.toLowerCase()]) return true;
			return el.disabled || isSheetReady(el.sheet, el.media || 'screen');
		}

		function isSheetReady(sheet, media) {
			// in Opera sheet.disabled is true when it's still loading,
			// even though link.disabled is false. they stay in sync if
			// set manually.
			if (!CSS.recognizesMedia(media || 'all')) return true;
			if (!sheet || sheet.disabled) return false;
			try {
				var rules = sheet.cssRules, rule;
				if (rules) {
					// needed for Safari 3 and Chrome 1.0.
					// in standards-conforming browsers cssRules contains @-rules.
					// Chrome 1.0 weirdness: rules[<number larger than .length - 1>]
					// returns the last rule, so a for loop is the only option.
					search: for (var i = 0, l = rules.length; rule = rules[i], i < l; ++i) {
						switch (rule.type) {
							case 2: // @charset
								break;
							case 3: // @import
								if (!isSheetReady(rule.styleSheet, rule.media.mediaText)) return false;
								break;
							default:
								// only @charset can precede @import
								break search;
						}
					}
				}
			}
			catch (e) {} // probably a style sheet from another domain
			return true;
		}

		function allStylesLoaded() {
			// Internet Explorer's style sheet model, there's no need to do anything
			if (document.createStyleSheet) return true;
			// standards-compliant browsers
			var el, i;
			for (i = 0; el = links[i]; ++i) {
				if (el.rel.toLowerCase() == 'stylesheet' && !isContainerReady(el)) return false;
			}
			for (i = 0; el = styles[i]; ++i) {
				if (!isContainerReady(el)) return false;
			}
			return true;
		}

		DOM.ready(function() {
			// getComputedStyle returns null in Gecko if used in an iframe with display: none
			if (!hasLayout) hasLayout = CSS.getStyle(document.body).isUsable();
			if (complete || (hasLayout && allStylesLoaded())) perform();
			else setTimeout(arguments.callee, 10);
		});

		return function(listener) {
			if (complete) listener();
			else queue.push(listener);
		};

	})();

	function Font(data) {

		var face = this.face = data.face, ligatureCache = [], wordSeparators = {
			'\u0020': 1,
			'\u00a0': 1,
			'\u3000': 1
		};

		this.glyphs = (function(glyphs) {
			var key, fallbacks = {
				'\u2011': '\u002d',
				'\u00ad': '\u2011'
			};
			for (key in fallbacks) {
				if (!hasOwnProperty(fallbacks, key)) continue;
				if (!glyphs[key]) glyphs[key] = glyphs[fallbacks[key]];
			}
			return glyphs;
		})(data.glyphs);

		this.w = data.w;
		this.baseSize = parseInt(face['units-per-em'], 10);

		this.family = face['font-family'].toLowerCase();
		this.weight = face['font-weight'];
		this.style = face['font-style'] || 'normal';

		this.viewBox = (function () {
			var parts = face.bbox.split(/\s+/);
			var box = {
				minX: parseInt(parts[0], 10),
				minY: parseInt(parts[1], 10),
				maxX: parseInt(parts[2], 10),
				maxY: parseInt(parts[3], 10)
			};
			box.width = box.maxX - box.minX;
			box.height = box.maxY - box.minY;
			box.toString = function() {
				return [ this.minX, this.minY, this.width, this.height ].join(' ');
			};
			return box;
		})();

		this.ascent = -parseInt(face.ascent, 10);
		this.descent = -parseInt(face.descent, 10);

		this.height = -this.ascent + this.descent;

		this.spacing = function(chars, letterSpacing, wordSpacing) {
			var glyphs = this.glyphs, glyph,
				kerning, k,
				jumps = [],
				width = 0, w,
				i = -1, j = -1, chr;
			while (chr = chars[++i]) {
				glyph = glyphs[chr] || this.missingGlyph;
				if (!glyph) continue;
				if (kerning) {
					width -= k = kerning[chr] || 0;
					jumps[j] -= k;
				}
				w = glyph.w;
				if (isNaN(w)) w = +this.w; // may have been a String in old fonts
				if (w > 0) {
					w += letterSpacing;
					if (wordSeparators[chr]) w += wordSpacing;
				}
				width += jumps[++j] = ~~w; // get rid of decimals
				kerning = glyph.k;
			}
			jumps.total = width;
			return jumps;
		};

		this.applyLigatures = function(text, ligatures) {
			// find cached ligature configuration for this font
			for (var i=0, ligatureConfig; i<ligatureCache.length && !ligatureConfig; i++)
				if (ligatureCache[i].ligatures === ligatures)
					ligatureConfig = ligatureCache[i];

			// if there is none, it needs to be created and cached
			if (!ligatureConfig) {
				// identify letter groups to prepare regular expression that matches these
				var letterGroups = [];
				for (var letterGroup in ligatures) {
					if (this.glyphs[ligatures[letterGroup]]) {
						letterGroups.push(letterGroup);
					}
				}

				// sort by longer groups first, then alphabetically (to aid caching by this key)
				var regexpText = letterGroups.sort(function(a, b) {
					return b.length - a.length || a > b;
				}).join('|');

				ligatureCache.push(ligatureConfig = {
					ligatures: ligatures,
					// create regular expression for matching desired ligatures that are present in the font
					regexp: regexpText.length > 0
						? regexpCache[regexpText] || (regexpCache[regexpText] = new RegExp(regexpText, 'g'))
						: null
				});
			}

			// return applied ligatures or original text if none exist for given configuration
			return ligatureConfig.regexp
				? text.replace(ligatureConfig.regexp, function(match) {
					return ligatures[match] || match;
				})
				: text;
		};
	}

	function FontFamily() {

		var styles = {}, mapping = {
			oblique: 'italic',
			italic: 'oblique'
		};
    this.style=styles;

		this.add = function(font) {
			(styles[font.style] || (styles[font.style] = {}))[font.weight] = font;
		};

		this.get = function(style, weight) {
			var weights = styles[style] || styles[mapping[style]]
				|| styles.normal || styles.italic || styles.oblique;
			if (!weights) return null;
			// we don't have to worry about "bolder" and "lighter"
			// because IE's currentStyle returns a numeric value for it,
			// and other browsers use the computed value anyway
			weight = {
				normal: 400,
				bold: 700
			}[weight] || parseInt(weight, 10);
			if (weights[weight]) return weights[weight];
			// http://www.w3.org/TR/CSS21/fonts.html#propdef-font-weight
			// Gecko uses x99/x01 for lighter/bolder
			var up = {
				1: 1,
				99: 0
			}[weight % 100], alts = [], min, max;
			if (up === undefined) up = weight > 400;
			if (weight == 500) weight = 400;
			for (var alt in weights) {
				if (!hasOwnProperty(weights, alt)) continue;
				alt = parseInt(alt, 10);
				if (!min || alt < min) min = alt;
				if (!max || alt > max) max = alt;
				alts.push(alt);
			}
			if (weight < min) weight = min;
			if (weight > max) weight = max;
			alts.sort(function(a, b) {
				return (up
					? (a >= weight && b >= weight) ? a < b : a > b
					: (a <= weight && b <= weight) ? a > b : a < b) ? -1 : 1;
			});
			return weights[alts[0]];
		};

	}

	function Style(style) {

		var custom = {}, sizes = {};

		this.extend = function(styles) {
			for (var property in styles) {
				if (hasOwnProperty(styles, property)) custom[property] = styles[property];
			}
			return this;
		};

		this.get = function(property) {
			return custom[property] != undefined ? custom[property] : style[property];
		};

		this.getSize = function(property, base) {
			return sizes[property] || (sizes[property] = new CSS.Size(this.get(property), base));
		};

		this.isUsable = function() {
			return !!style;
		};

	}

	function cached(fun) {
		var cache = {};
		return function(key) {
			if (!hasOwnProperty(cache, key)) cache[key] = fun.apply(null, arguments);
			return cache[key];
		};
	}

	function getFont(el, style) {
		var families = CSS.quotedList(style.get('fontFamily').toLowerCase()), family;
		for (var i = 0; family = families[i]; ++i) {
			if (fonts[family]) return fonts[family].get(style.get('fontStyle'), style.get('fontWeight'));
		}
		return null;
	}

	function elementsByTagName(query) {
		return document.getElementsByTagName(query);
	}

	function hasOwnProperty(obj, property) {
		return obj.hasOwnProperty(property);
	}

	function merge() {
		var merged = {}, arg, key;
		for (var i = 0, l = arguments.length; arg = arguments[i], i < l; ++i) {
			for (key in arg) {
				if (hasOwnProperty(arg, key)) merged[key] = arg[key];
			}
		}
		return merged;
	}

	function process(font, text, style, options, node, el) {
    console.log('process');
		var fragment = document.createDocumentFragment(), processed;
		if (text === '') return fragment;
		var separate = options.separate;
		var parts = text.split(separators[separate]), needsAligning = (separate == 'words');
		if (needsAligning && HAS_BROKEN_REGEXP) {
			// @todo figure out a better way to do this
			if (/^\s/.test(text)) parts.unshift('');
			if (/\s$/.test(text)) parts.push('');
		}
		for (var i = 0, l = parts.length; i < l; ++i) {
      console.log('rendering', parts[i]);
      // this is where it calls the engine to render the text
			processed = engines[options.engine](font,
				needsAligning ? CSS.textAlign(parts[i], style, i, l) : parts[i],
				style, options, node, el, i < l - 1);
      console.log(processed);
			if (processed) fragment.appendChild(processed);
		}
		return fragment;
	}

	function removeEvent(el, type, listener) {
		if (el.removeEventListener) {
			el.removeEventListener(type, listener, false);
		}
		else if (el.detachEvent) {
			el.detachEvent('on' + type, listener);
		}
	}

	function replaceElement(el, options) {
		var name = el.nodeName.toLowerCase();
		if (options.ignore[name]) return;
		if (options.ignoreClass && options.ignoreClass.test(el.className)) return;
		if (options.onBeforeReplace) options.onBeforeReplace(el, options);
		var replace = !options.textless[name], simple = (options.trim === 'simple');
		var style = CSS.getStyle(el).extend(options);
		// may cause issues if the element contains other elements
		// with larger fontSize, however such cases are rare and can
		// be fixed by using a more specific selector
		if (parseFloat(style.get('fontSize')) === 0) return;
		var font = getFont(el, style), node, type, next, anchor, text, lastElement;
		var isShy = options.softHyphens, anyShy = false, pos, shy, reShy = /\u00ad/g;
		var modifyText = options.modifyText;
		if (!font) return;
		for (node = el.firstChild; node; node = next) {
			type = node.nodeType;
			next = node.nextSibling;
			if (replace && type == 3) {
				if (isShy && el.nodeName.toLowerCase() != TAG_SHY) {
					pos = node.data.indexOf('\u00ad');
					if (pos >= 0) {
						node.splitText(pos);
						next = node.nextSibling;
						next.deleteData(0, 1);
						shy = document.createElement(TAG_SHY);
						shy.appendChild(document.createTextNode('\u00ad'));
						el.insertBefore(shy, next);
						next = shy;
						anyShy = true;
					}
				}
				// Node.normalize() is broken in IE 6, 7, 8
				if (anchor) {
					anchor.appendData(node.data);
					el.removeChild(node);
				}
				else anchor = node;
				if (next) continue;
			}
			if (anchor) {
				text = anchor.data;
				if (!isShy) text = text.replace(reShy, '');
				text = CSS.whiteSpace(text, style, anchor, lastElement, simple);
				// modify text only on the first replace
				if (modifyText) text = modifyText(text, anchor, el, options);
        console.log(el, font, text, style, options, node, anchor)
				el.replaceChild(process(font, text, style, options, node, el), anchor);
				anchor = null;
			}
			if (type == 1) {
				if (node.firstChild) {
					if (node.nodeName.toLowerCase() == 'cufon') {
						engines[options.engine](font, null, style, options, node, el);
					}
					else arguments.callee(node, options);
				}
				lastElement = node;
			}
		}
		if (options.onAfterReplace) options.onAfterReplace(el, options);
	}
  api.replaceElement = replaceElement;


	var HAS_BROKEN_REGEXP = ' '.split(/\s+/).length == 0;
	var TAG_GLUE = 'cufonglue';
	var TAG_SHY = 'cufonshy';
	var C_SHY_DISABLED = 'cufon-shy-disabled';
	var C_VIEWPORT_RESIZING = 'cufon-viewport-resizing';

	var regexpCache = {};
	var initialized = false;
	var trackingShy = false;
	var shyTimer;
	var ignoreResize = false;

	var engines = {}, fonts = {}, defaultOptions = {
		autoDetect: false,
		engine: null,
		forceHitArea: false,
		hover: false,
		hoverables: {
			a: true
		},
		ignore: {
			applet: 1,
			canvas: 1,
			col: 1,
			colgroup: 1,
			head: 1,
			iframe: 1,
			map: 1,
			noscript: 1,
			optgroup: 1,
			option: 1,
			script: 1,
			select: 1,
			style: 1,
			textarea: 1,
			title: 1,
			pre: 1
		},
		ignoreClass: null,
		modifyText: null,
		onAfterReplace: null,
		onBeforeReplace: null,
		printable: true,
		selector: (
				window.Sizzle
			||	(window.jQuery && function(query) { return jQuery(query); }) // avoid noConflict issues
			||	(window.dojo && dojo.query)
			||	(window.glow && glow.dom && glow.dom.get)
			||	(window.Ext && Ext.query)
			||	(window.YAHOO && YAHOO.util && YAHOO.util.Selector && YAHOO.util.Selector.query)
			||	(window.$$ && function(query) { return $$(query); })
			||	(window.$ && function(query) { return $(query); })
			||	(document.querySelectorAll && function(query) { return document.querySelectorAll(query); })
			||	elementsByTagName
		),
		separate: 'words', // 'none' and 'characters' are also accepted
		softHyphens: true,
		textless: {
			dl: 1,
			html: 1,
			ol: 1,
			table: 1,
			tbody: 1,
			thead: 1,
			tfoot: 1,
			tr: 1,
			ul: 1
		},
		textShadow: 'none',
		trim: 'advanced',
		ligatures: {
			'ff': '\ufb00',
			'fi': '\ufb01',
			'fl': '\ufb02',
			'ffi': '\ufb03',
			'ffl': '\ufb04',
			'\u017ft': '\ufb05',
			'st': '\ufb06'
		}
	};

	var separators = {
		// The first pattern may cause unicode characters above
		// code point 255 to be removed in Safari 3.0. Luckily enough
		// Safari 3.0 does not include non-breaking spaces in \s, so
		// we can just use a simple alternative pattern.
		words: /\s/.test('\u00a0') ? /[^\S\u00a0]+/ : /\s+/,
		characters: '',
		none: /^/
	};

  api.defaultOptions = defaultOptions;

	api.now = function() {
		DOM.ready();
		return api;
	};

	api.refresh = function() {
		replaceHistory.repeat.apply(replaceHistory, arguments);
		return api;
	};

	api.registerEngine = function(id, engine) {
		if (!engine) return api;
		engines[id] = engine;
		return api.set('engine', id);
	};
  api.fonts = fonts;

	api.registerFont = function(data) {
		if (!data) return api;
		var font = new Font(data), family = font.family;
		if (!fonts[family]) fonts[family] = new FontFamily();
		fonts[family].add(font);
		return api.set('fontFamily', '"' + family + '"');
	};

	api.replace = function(elements, options, ignoreHistory) {
		options = merge(defaultOptions, options);
		if (!options.engine) return api; // there's no browser support so we'll just stop here
		if (!initialized) {
			CSS.addClass(DOM.root(), 'cufon-active cufon-loading');
			CSS.ready(function() {
				// fires before any replace() calls, but it doesn't really matter
				CSS.addClass(CSS.removeClass(DOM.root(), 'cufon-loading'), 'cufon-ready');
			});
			initialized = true;
		}
		if (options.hover) options.forceHitArea = true;
		if (options.autoDetect) delete options.fontFamily;
		if (typeof options.ignoreClass == 'string') {
			options.ignoreClass = new RegExp('(?:^|\\s)(?:' + options.ignoreClass.replace(/\s+/g, '|') + ')(?:\\s|$)');
		}
		if (typeof options.textShadow == 'string') {
			options.textShadow = CSS.textShadow(options.textShadow);
		}
		if (typeof options.color == 'string' && /^-/.test(options.color)) {
			options.textGradient = CSS.gradient(options.color);
		}
		else delete options.textGradient;
		if (typeof elements == 'string') {
			if (!ignoreHistory) replaceHistory.add(elements, arguments);
			elements = [ elements ];
		}
		else if (elements.nodeType) elements = [ elements ];
		CSS.ready(function() {
			for (var i = 0, l = elements.length; i < l; ++i) {
				var el = elements[i];
				if (typeof el == 'string') api.replace(options.selector(el), options, true);
				else replaceElement(el, options);
			}
		});
		return api;
	};

	api.set = function(option, value) {
		defaultOptions[option] = value;
		return api;
	};

	return api;

})();


Cufon.registerEngine('canvas', (function() {

	// Safari 2 doesn't support .apply() on native methods

	var check = document.createElement('canvas');
	if (!check || !check.getContext || !check.getContext.apply) return;
	check = null;

	var HAS_INLINE_BLOCK = Cufon.CSS.supports('display', 'inline-block');

	function generateFromVML(path, context) {
		var atX = 0, atY = 0;
		var code = [], re = /([mrvxe])([^a-z]*)/g, match;
		generate: for (var i = 0; match = re.exec(path); ++i) {
			var c = match[2].split(',');
			switch (match[1]) {
				case 'v':
					code[i] = { m: 'bezierCurveTo', a: [ atX + ~~c[0], atY + ~~c[1], atX + ~~c[2], atY + ~~c[3], atX += ~~c[4], atY += ~~c[5] ] };
					break;
				case 'r':
					code[i] = { m: 'lineTo', a: [ atX += ~~c[0], atY += ~~c[1] ] };
					break;
				case 'm':
					code[i] = { m: 'moveTo', a: [ atX = ~~c[0], atY = ~~c[1] ] };
					break;
				case 'x':
					code[i] = { m: 'closePath' };
					break;
				case 'e':
					break generate;
			}
			context[code[i].m].apply(context, code[i].a);
		}
		return code;
	}

	function interpret(code, context) {
		for (var i = 0, l = code.length; i < l; ++i) {
			var line = code[i];
			context[line.m].apply(context, line.a);
		}
	}

	return function(font, text, style, options, node, el) {

		var redraw = (text === null);

		if (redraw) text = node.getAttribute('alt');

		var viewBox = font.viewBox;

		var size = style.getSize('fontSize', font.baseSize);

		var expandTop = 0, expandRight = 0, expandBottom = 0, expandLeft = 0;
		var shadows = options.textShadow, shadowOffsets = [];

		var chars = Cufon.CSS.textTransform(options.ligatures ? font.applyLigatures(text, options.ligatures) : text, style).split('');

		var jumps = font.spacing(chars,
			~~size.convertFrom(parseFloat(style.get('letterSpacing')) || 0),
			~~size.convertFrom(parseFloat(style.get('wordSpacing')) || 0)
		);

		if (!jumps.length) return null; // there's nothing to render

		var width = jumps.total;

		expandRight += viewBox.width - jumps[jumps.length - 1];
		expandLeft += viewBox.minX;

		var wrapper, canvas;

		if (redraw) {
			wrapper = node;
			canvas = node.firstChild;
		}
		else {
			wrapper = document.createElement('cufon');
			wrapper.className = 'cufon cufon-canvas';
			wrapper.setAttribute('alt', text);

			canvas = document.createElement('canvas');
			wrapper.appendChild(canvas);

			if (options.printable) {
				var print = document.createElement('cufontext');
				print.appendChild(document.createTextNode(text));
				wrapper.appendChild(print);
			}
		}

		var wStyle = wrapper.style;
		var cStyle = canvas.style;

		var height = size.convert(viewBox.height);
		var roundedHeight = Math.ceil(height);
		var roundingFactor = roundedHeight / height;
		var stretchFactor = roundingFactor * Cufon.CSS.fontStretch(style.get('fontStretch'));
		var stretchedWidth = width * stretchFactor;

		var canvasWidth = Math.ceil(size.convert(stretchedWidth + expandRight - expandLeft));
		var canvasHeight = Math.ceil(size.convert(viewBox.height - expandTop + expandBottom));

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		// needed for WebKit and full page zoom
		cStyle.width = canvasWidth + 'px';
		cStyle.height = canvasHeight + 'px';

		// minY has no part in canvas.height
		expandTop += viewBox.minY;

		cStyle.top = Math.round(size.convert(expandTop - font.ascent)) + 'px';
		cStyle.left = Math.round(size.convert(expandLeft)) + 'px';

		var wrapperWidth = Math.max(Math.ceil(size.convert(stretchedWidth)), 0) + 'px';

		if (HAS_INLINE_BLOCK) {
			wStyle.width = wrapperWidth;
			wStyle.height = size.convert(font.height) + 'px';
		}
		else {
			wStyle.paddingLeft = wrapperWidth;
			wStyle.paddingBottom = (size.convert(font.height) - 1) + 'px';
		}

		var g = canvas.getContext('2d'), scale = height / viewBox.height;
		var pixelRatio = window.devicePixelRatio || 1;
		if (pixelRatio != 1) {
			canvas.width = canvasWidth * pixelRatio;
			canvas.height = canvasHeight * pixelRatio;
			g.scale(pixelRatio, pixelRatio);
		}

		// proper horizontal scaling is performed later
		g.scale(scale, scale * roundingFactor);
		g.translate(-expandLeft, -expandTop);
		g.save();

		function renderText() {
      console.log('renderText', font, g, stretchFactor, chars, generateFromVML, jumps);
			var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
			g.scale(stretchFactor, 1);
			while (chr = chars[++i]) {
				var glyph = glyphs[chars[i]] || font.missingGlyph;
				if (!glyph) continue;
				if (glyph.d) {
					g.beginPath();
					// the following moveTo is for Opera 9.2. if we don't
					// do this, it won't forget the previous path which
					// results in garbled text.
					g.moveTo(0, 0);
          console.log(chr, glyph.code)
					if (glyph.code) interpret(glyph.code, g);
					else glyph.code = generateFromVML('m' + glyph.d, g); // KPK: this line draws it
          console.log(glyph.code)
					g.fill();
				}
				g.translate(jumps[++j], 0);
			}
			g.restore();
		}

    g.fillStyle = style.get('color');

		renderText();

		return wrapper;

	};

})());
