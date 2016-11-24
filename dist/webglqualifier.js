(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebGLQualifier = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _defaultVertex = require('./shader/default.vertex.glsl');

var _defaultVertex2 = _interopRequireDefault(_defaultVertex);

var _defaultFragment = require('./shader/default.fragment.glsl');

var _defaultFragment2 = _interopRequireDefault(_defaultFragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebGLQualifier = function () {
	function WebGLQualifier(options) {
		_classCallCheck(this, WebGLQualifier);

		this.options = Object.assign({}, {
			benchmarkDuration: 2,
			benchmarkVertexShader: _defaultVertex2.default,
			benchmarkFragmentShader: _defaultFragment2.default,
			qualityRange: [15, 30, 45, 56],
			qualityNames: ['ultralow', 'low', 'medium', 'high', 'ultrahigh'],
			showBenchmark: false
		}, options);

		this.webGLenabled = this._checkWebGLEnabled();
		this.hardwareAccelerated = this._checkHardwareAccelerated();

		this.benchmarkFPS = 0;
		this.currentQualityValue = -1;
		this.currentQualityName = '';
	}

	_createClass(WebGLQualifier, [{
		key: '_checkWebGLEnabled',
		value: function _checkWebGLEnabled() {
			if (!!window.WebGLRenderingContext) {
				var canvas = document.createElement("canvas"),
				    names = ["webgl", "experimental-webgl", "moz-webgl"],
				    gl = false;

				for (var i in names) {
					try {
						gl = canvas.getContext(names[i]);
						if (gl && typeof gl.getParameter == "function") {
							// WebGL is enabled
							// return true;
							return names[i];
						}
					} catch (e) {}
				}

				// WebGL is supported, but disabled
				return false;
			}

			// WebGL not supported
			return false;
		}
	}, {
		key: '_checkHardwareAccelerated',
		value: function _checkHardwareAccelerated() {
			// check software rendering for IE11
			var isIE11 = /Trident.*rv[ :]*11\./.test(window.navigator.userAgent);

			if (this.enabled && isIE11) {
				var canvas = $('<canvas></canvas>')[0];
				var context = canvas.getContext(this.enabled, { antialias: false, stencil: true, failIfMajorPerformanceCaveat: true });

				// damn, no hardware acceleration !..
				if (context == null) {
					return false;
				}
			}

			return true;
		}
	}, {
		key: '_getQualityValue',
		value: function _getQualityValue(fps) {
			if (!fps) {
				fps = this.benchmarkFPS;
			}

			for (var i = 0; i < this.options.qualityRange.length; i++) {
				if (fps < this.options.qualityRange[i]) {
					return i;
				}
			}

			return this.options.qualityRange.length;
		}
	}, {
		key: '_getQualityName',
		value: function _getQualityName(qualityIndex) {
			return this.options.qualityNames[qualityIndex];
		}

		// start benchmark
		// return canvas used for benchmark

	}, {
		key: 'benchmark',
		value: function benchmark(callback) {
			var _this = this;

			// no webgl
			if (!this.isWebGLenabled() || !this.isHardwareAccelerated()) {
				this.benchmarkFPS = 0;
				this.currentQualityValue = -1;
				this.currentQualityName = '';

				if (callback) {
					callback(this.benchmarkFPS, this.currentQualityName, this.currentQualityValue);
				}
			}

			// requestAnimFrame shim
			var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function (c) {
				window.setTimeout(c, 15);
			};

			// create webgl context on the canvas element
			var canvas = document.createElement("canvas");
			canvas.width = 800;
			canvas.height = 600;
			canvas.style.position = 'absolute';
			if (this.options.showBenchmark) {
				canvas.style.visibility = 'visible';
			} else {
				canvas.style.visibility = 'hidden';
				canvas.style.width = '1px';
				canvas.style.height = '1px';
			}

			// add canvas to DOM
			// if not added, performance won't be real
			document.body.appendChild(canvas);

			var aspect = canvas.width / canvas.height;
			var gl = canvas.getContext("experimental-webgl");

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);

			// get the vertex and fragment shader source
			var v = this.options.benchmarkVertexShader;
			var _f = this.options.benchmarkFragmentShader;

			// compile and link the shaders
			var vs = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vs, v);
			gl.compileShader(vs);

			var fs = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fs, _f);
			gl.compileShader(fs);

			var program = gl.createProgram();
			gl.attachShader(program, vs);
			gl.attachShader(program, fs);
			gl.linkProgram(program);

			// debug shader compile status
			var error = false;
			if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
				error = true;
				//console.log(gl.getShaderInfoLog(vs));
			}

			if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
				error = true;
				//console.log(gl.getShaderInfoLog(fs));
			}

			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				error = true;
				//console.log(gl.getProgramInfoLog(program));
			}
			if (error) {
				// remove canvas from DOM
				document.body.removeChild(canvas);

				this.benchmarkFPS = 0;
				this.currentQualityValue = -1;
				this.currentQualityName = '';

				if (callback) {
					callback(this.benchmarkFPS, this.currentQualityName, this.currentQualityValue);
				}

				return;
			}

			// gl.getParameter( glExtensionDebugRendererInfo.UNMASKED_RENDERER_WEBGL )
			// gl.getParameter( glExtensionDebugRendererInfo.UNMASKED_VENDOR_WEBGL )

			var firstTime = Date.now();
			var nbFrames = 0;
			(_f = function f() {
				nbFrames++;

				// create vertices to fill the canvas with a single quad
				var vertices = new Float32Array([-1, 1 * aspect, 1, 1 * aspect, 1, -1 * aspect, -1, 1 * aspect, 1, -1 * aspect, -1, -1 * aspect]);

				var vbuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
				gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

				var triCount = 2,
				    numItems = vertices.length / triCount;

				gl.useProgram(program);

				var time = (Date.now() - firstTime) / 1000.0;
				//program.time = gl.getUniformLocation(program, "time");
				//gl.uniform1f(program.time, time);
				program.resolution = gl.getUniformLocation(program, "iResolution");
				gl.uniform2f(program.resolution, canvas.width, canvas.height);

				program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
				gl.enableVertexAttribArray(program.aVertexPosition);
				gl.vertexAttribPointer(program.aVertexPosition, triCount, gl.FLOAT, false, 0, 0);

				gl.drawArrays(gl.TRIANGLES, 0, numItems);

				if (time >= _this.options.benchmarkDuration) {
					// remove canvas from DOM
					document.body.removeChild(canvas);

					_this.benchmarkFPS = nbFrames / time;
					_this.currentQualityValue = _this._getQualityValue(_this.benchmarkFPS);
					_this.currentQualityName = _this._getQualityName(_this.currentQualityValue);

					if (callback) {
						callback(_this.benchmarkFPS, _this.currentQualityName, _this.currentQualityValue);
					}
				} else {
					requestAnimationFrame(_f);
				}
			})();

			return canvas;
		}
	}, {
		key: 'isWebGLenabled',
		value: function isWebGLenabled() {
			return this.webGLenabled;
		}
	}, {
		key: 'isHardwareAccelerated',
		value: function isHardwareAccelerated() {
			return this.hardwareAccelerated;
		}
	}]);

	return WebGLQualifier;
}();

module.exports = WebGLQualifier;

},{"./shader/default.fragment.glsl":2,"./shader/default.vertex.glsl":3}],2:[function(require,module,exports){
module.exports = "// simple raytracing example\n// a sphere + a plane\n// if it's hard to deal with this shader, be assured your gc is slow...\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform vec2 iResolution;\n\n//void main() { gl_FragColor = vec4(1.0); }\n\nfloat sdPlane(vec3 p) {\n    return p.y;\n}\n\nfloat sdSphere(vec3 p, float s) {\n    return length(p) - s;\n}\n\n//----------------------------------------------------------------------\n\nvec2 opU( vec2 d1, vec2 d2 ) {\n    return (d1.x<d2.x) ? d1 : d2;\n}\n\n//----------------------------------------------------------------------\n\nvec2 map(in vec3 pos) {\n    return opU(vec2(sdPlane(pos), 1.0), vec2(sdSphere(pos - vec3(0.0,0.25, 0.0), 0.25), 46.9));\n}\n\nvec2 castRay( in vec3 ro, in vec3 rd ) {\n    float tmin = 1.0;\n    float tmax = 20.0;\n\n    float precis = 0.002;\n    float t = tmin;\n    float m = -1.0;\n    for( int i=0; i<50; i++ ) {\n        vec2 res = map( ro+rd*t );\n        if( res.x<precis || t>tmax ) break;\n        t += res.x;\n        m = res.y;\n    }\n\n    if( t>tmax ) m=-1.0;\n    return vec2( t, m );\n}\n\nfloat softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax ) {\n    float res = 1.0;\n    float t = mint;\n    for( int i=0; i<16; i++ )\n    {\n        float h = map( ro + rd*t ).x;\n        res = min( res, 8.0*h/t );\n        t += clamp( h, 0.02, 0.10 );\n        if( h<0.001 || t>tmax ) break;\n    }\n    return clamp( res, 0.0, 1.0 );\n\n}\n\nvec3 calcNormal( in vec3 pos ) {\n    vec3 eps = vec3( 0.001, 0.0, 0.0 );\n    vec3 nor = vec3(\n    map(pos+eps.xyy).x - map(pos-eps.xyy).x,\n    map(pos+eps.yxy).x - map(pos-eps.yxy).x,\n    map(pos+eps.yyx).x - map(pos-eps.yyx).x );\n    return normalize(nor);\n}\n\nfloat calcAO( in vec3 pos, in vec3 nor ) {\n    float occ = 0.0;\n    float sca = 1.0;\n    for( int i=0; i<5; i++ )\n    {\n        float hr = 0.01 + 0.12*float(i)/4.0;\n        vec3 aopos =  nor * hr + pos;\n        float dd = map( aopos ).x;\n        occ += -(dd-hr)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );\n}\n\nvec3 render( in vec3 ro, in vec3 rd ) {\n    vec3 col = vec3(0.7, 0.9, 1.0) +rd.y*0.8;\n    vec2 res = castRay(ro,rd);\n    float t = res.x;\n    float m = res.y;\n    if( m>-0.5 ) {\n        vec3 pos = ro + t*rd;\n        vec3 nor = calcNormal( pos );\n        vec3 ref = reflect( rd, nor );\n\n        // material\n        col = 0.45 + 0.3*sin( vec3(0.05,0.08,0.10)*(m-1.0) );\n\n        if( m<1.5 )\n        {\n            float f = mod( floor(5.0*pos.z) + floor(5.0*pos.x), 2.0);\n            col = 0.4 + 0.1*f*vec3(1.0);\n        }\n\n        // lighitng\n        float occ = calcAO( pos, nor );\n        vec3  lig = normalize( vec3(-0.6, 0.7, -0.5) );\n        float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );\n        float dif = clamp( dot( nor, lig ), 0.0, 1.0 );\n        float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);\n        float dom = smoothstep( -0.1, 0.1, ref.y );\n        float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );\n        float spe = pow(clamp( dot( ref, lig ), 0.0, 1.0 ),16.0);\n\n        dif *= softshadow( pos, lig, 0.02, 2.5 );\n        dom *= softshadow( pos, ref, 0.02, 2.5 );\n\n        vec3 lin = vec3(0.0);\n        lin += 1.20*dif*vec3(1.00,0.85,0.55);\n        lin += 1.20*spe*vec3(1.00,0.85,0.55)*dif;\n        lin += 0.20*amb*vec3(0.50,0.70,1.00)*occ;\n        lin += 0.30*dom*vec3(0.50,0.70,1.00)*occ;\n        lin += 0.30*bac*vec3(0.25,0.25,0.25)*occ;\n        lin += 0.40*fre*vec3(1.00,1.00,1.00)*occ;\n        col = col*lin;\n\n        col = mix( col, vec3(0.8,0.9,1.0), 1.0-exp( -0.002*t*t ) );\n\n    }\n\n    return vec3( clamp(col,0.0,1.0) );\n}\n\nmat3 setCamera( in vec3 ro, in vec3 ta, float cr ) {\n    vec3 cw = normalize(ta-ro);\n    vec3 cp = vec3(sin(cr), cos(cr),0.0);\n    vec3 cu = normalize( cross(cw,cp) );\n    vec3 cv = normalize( cross(cu,cw) );\n    return mat3( cu, cv, cw );\n}\n\nvoid main() {\n    vec2 q = gl_FragCoord.xy/iResolution.xy;\n    vec2 p = -1.0+2.0*q;\n    p.x *= iResolution.x/iResolution.y;\n\n    float time = 15.0;// + iGlobalTime;\n\n    // camera\n    vec3 ro = vec3(-0.5+1.5*cos(0.1*time), 1.0, -0.5 + 1.5*sin(0.1*time));\n    vec3 ta = vec3(0.0, 0.0, 0.0);\n\n    // camera-to-world transformation\n    mat3 ca = setCamera( ro, ta, 0.0 );\n\n    // ray direction\n    vec3 rd = ca * normalize( vec3(p.xy,2.0) );\n\n    // render\n    vec3 col = render( ro, rd );\n\n    col = pow( col, vec3(0.4545) );\n\n    gl_FragColor = vec4(col, 1.0);\n}\n";

},{}],3:[function(require,module,exports){
module.exports = "attribute vec2 aVertexPosition;\n\nvoid main() {\n    gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n}\n";

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvV2ViR0xRdWFsaWZpZXIuanMiLCJzcmMvc2hhZGVyL2RlZmF1bHQuZnJhZ21lbnQuZ2xzbCIsInNyYy9zaGFkZXIvZGVmYXVsdC52ZXJ0ZXguZ2xzbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQTs7OztBQUNBOzs7Ozs7OztJQUVNLGM7QUFFTCx5QkFBWSxPQUFaLEVBQXFCO0FBQUE7O0FBQ3BCLE9BQUssT0FBTCxHQUFlLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0I7QUFDaEMsc0JBQW1CLENBRGE7QUFFaEMsaURBRmdDO0FBR2hDLHFEQUhnQztBQUloQyxpQkFBYyxDQUFDLEVBQUQsRUFBSyxFQUFMLEVBQVMsRUFBVCxFQUFhLEVBQWIsQ0FKa0I7QUFLaEMsaUJBQWMsQ0FBQyxVQUFELEVBQWEsS0FBYixFQUFvQixRQUFwQixFQUE4QixNQUE5QixFQUFzQyxXQUF0QyxDQUxrQjtBQU1oQyxrQkFBZTtBQU5pQixHQUFsQixFQU9aLE9BUFksQ0FBZjs7QUFTQSxPQUFLLFlBQUwsR0FBb0IsS0FBSyxrQkFBTCxFQUFwQjtBQUNBLE9BQUssbUJBQUwsR0FBMkIsS0FBSyx5QkFBTCxFQUEzQjs7QUFFQSxPQUFLLFlBQUwsR0FBb0IsQ0FBcEI7QUFDQSxPQUFLLG1CQUFMLEdBQTJCLENBQUMsQ0FBNUI7QUFDQSxPQUFLLGtCQUFMLEdBQTBCLEVBQTFCO0FBQ0E7Ozs7dUNBRW9CO0FBQ3BCLE9BQUksQ0FBQyxDQUFDLE9BQU8scUJBQWIsRUFBb0M7QUFDbkMsUUFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFiO0FBQUEsUUFDQyxRQUFRLENBQUMsT0FBRCxFQUFVLG9CQUFWLEVBQWdDLFdBQWhDLENBRFQ7QUFBQSxRQUVDLEtBQUssS0FGTjs7QUFJQSxTQUFLLElBQUksQ0FBVCxJQUFjLEtBQWQsRUFBcUI7QUFDcEIsU0FBSTtBQUNILFdBQUss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QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgdmVydGV4U2hhZGVyIGZyb20gJy4vc2hhZGVyL2RlZmF1bHQudmVydGV4Lmdsc2wnO1xuaW1wb3J0IGZyYWdtZW50U2hhZGVyIGZyb20gJy4vc2hhZGVyL2RlZmF1bHQuZnJhZ21lbnQuZ2xzbCc7XG5cbmNsYXNzIFdlYkdMUXVhbGlmaWVyIHtcblxuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0dGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwge1xuXHRcdFx0YmVuY2htYXJrRHVyYXRpb246IDIsXG5cdFx0XHRiZW5jaG1hcmtWZXJ0ZXhTaGFkZXI6IHZlcnRleFNoYWRlcixcblx0XHRcdGJlbmNobWFya0ZyYWdtZW50U2hhZGVyOiBmcmFnbWVudFNoYWRlcixcblx0XHRcdHF1YWxpdHlSYW5nZTogWzE1LCAzMCwgNDUsIDU2XSxcblx0XHRcdHF1YWxpdHlOYW1lczogWyd1bHRyYWxvdycsICdsb3cnLCAnbWVkaXVtJywgJ2hpZ2gnLCAndWx0cmFoaWdoJ10sXG5cdFx0XHRzaG93QmVuY2htYXJrOiBmYWxzZVxuXHRcdH0sIG9wdGlvbnMpO1xuXG5cdFx0dGhpcy53ZWJHTGVuYWJsZWQgPSB0aGlzLl9jaGVja1dlYkdMRW5hYmxlZCgpO1xuXHRcdHRoaXMuaGFyZHdhcmVBY2NlbGVyYXRlZCA9IHRoaXMuX2NoZWNrSGFyZHdhcmVBY2NlbGVyYXRlZCgpO1xuXG5cdFx0dGhpcy5iZW5jaG1hcmtGUFMgPSAwO1xuXHRcdHRoaXMuY3VycmVudFF1YWxpdHlWYWx1ZSA9IC0xO1xuXHRcdHRoaXMuY3VycmVudFF1YWxpdHlOYW1lID0gJyc7XG5cdH1cblxuXHRfY2hlY2tXZWJHTEVuYWJsZWQoKSB7XG5cdFx0aWYgKCEhd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCkge1xuXHRcdFx0bGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksXG5cdFx0XHRcdG5hbWVzID0gW1wid2ViZ2xcIiwgXCJleHBlcmltZW50YWwtd2ViZ2xcIiwgXCJtb3otd2ViZ2xcIl0sXG5cdFx0XHRcdGdsID0gZmFsc2U7XG5cblx0XHRcdGZvciAobGV0IGkgaW4gbmFtZXMpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRnbCA9IGNhbnZhcy5nZXRDb250ZXh0KG5hbWVzW2ldKTtcblx0XHRcdFx0XHRpZiAoZ2wgJiYgdHlwZW9mIGdsLmdldFBhcmFtZXRlciA9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRcdC8vIFdlYkdMIGlzIGVuYWJsZWRcblx0XHRcdFx0XHRcdC8vIHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdFx0cmV0dXJuIG5hbWVzW2ldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIFdlYkdMIGlzIHN1cHBvcnRlZCwgYnV0IGRpc2FibGVkXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gV2ViR0wgbm90IHN1cHBvcnRlZFxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdF9jaGVja0hhcmR3YXJlQWNjZWxlcmF0ZWQoKSB7XG5cdFx0Ly8gY2hlY2sgc29mdHdhcmUgcmVuZGVyaW5nIGZvciBJRTExXG5cdFx0bGV0IGlzSUUxMSA9IC9UcmlkZW50LipydlsgOl0qMTFcXC4vLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cdFx0aWYgKHRoaXMuZW5hYmxlZCAmJiBpc0lFMTEpIHtcblx0XHRcdGxldCBjYW52YXMgPSAkKCc8Y2FudmFzPjwvY2FudmFzPicpWzBdO1xuXHRcdFx0bGV0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCh0aGlzLmVuYWJsZWQsIHthbnRpYWxpYXM6IGZhbHNlLCBzdGVuY2lsOiB0cnVlLCBmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0OiB0cnVlfSk7XG5cblx0XHRcdC8vIGRhbW4sIG5vIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiAhLi5cblx0XHRcdGlmIChjb250ZXh0ID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0X2dldFF1YWxpdHlWYWx1ZShmcHMpIHtcblx0XHRpZiAoIWZwcykge1xuXHRcdFx0ZnBzID0gdGhpcy5iZW5jaG1hcmtGUFM7XG5cdFx0fVxuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMucXVhbGl0eVJhbmdlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoZnBzIDwgdGhpcy5vcHRpb25zLnF1YWxpdHlSYW5nZVtpXSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLnF1YWxpdHlSYW5nZS5sZW5ndGg7XG5cdH1cblxuXHRfZ2V0UXVhbGl0eU5hbWUocXVhbGl0eUluZGV4KSB7XG5cdFx0cmV0dXJuIHRoaXMub3B0aW9ucy5xdWFsaXR5TmFtZXNbcXVhbGl0eUluZGV4XTtcblx0fVxuXG5cdC8vIHN0YXJ0IGJlbmNobWFya1xuXHQvLyByZXR1cm4gY2FudmFzIHVzZWQgZm9yIGJlbmNobWFya1xuXHRiZW5jaG1hcmsoY2FsbGJhY2spIHtcblx0XHQvLyBubyB3ZWJnbFxuXHRcdGlmICghdGhpcy5pc1dlYkdMZW5hYmxlZCgpIHx8ICF0aGlzLmlzSGFyZHdhcmVBY2NlbGVyYXRlZCgpKSB7XG5cdFx0XHR0aGlzLmJlbmNobWFya0ZQUyA9IDA7XG5cdFx0XHR0aGlzLmN1cnJlbnRRdWFsaXR5VmFsdWUgPSAtMTtcblx0XHRcdHRoaXMuY3VycmVudFF1YWxpdHlOYW1lID0gJyc7XG5cblx0XHRcdGlmIChjYWxsYmFjaykge1xuXHRcdFx0XHRjYWxsYmFjayh0aGlzLmJlbmNobWFya0ZQUywgdGhpcy5jdXJyZW50UXVhbGl0eU5hbWUsIHRoaXMuY3VycmVudFF1YWxpdHlWYWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gcmVxdWVzdEFuaW1GcmFtZSBzaGltXG5cdFx0bGV0IHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdFx0d2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdGZ1bmN0aW9uIChjKSB7XG5cdFx0XHRcdHdpbmRvdy5zZXRUaW1lb3V0KGMsIDE1KVxuXHRcdFx0fTtcblxuXHRcdC8vIGNyZWF0ZSB3ZWJnbCBjb250ZXh0IG9uIHRoZSBjYW52YXMgZWxlbWVudFxuXHRcdGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXHRcdGNhbnZhcy53aWR0aCA9IDgwMDtcblx0XHRjYW52YXMuaGVpZ2h0ID0gNjAwO1xuXHRcdGNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0aWYgKHRoaXMub3B0aW9ucy5zaG93QmVuY2htYXJrKSB7XG5cdFx0XHRjYW52YXMuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcblx0XHRcdGNhbnZhcy5zdHlsZS53aWR0aCA9ICcxcHgnO1xuXHRcdFx0Y2FudmFzLnN0eWxlLmhlaWdodCA9ICcxcHgnO1xuXHRcdH1cblxuXHRcdC8vIGFkZCBjYW52YXMgdG8gRE9NXG5cdFx0Ly8gaWYgbm90IGFkZGVkLCBwZXJmb3JtYW5jZSB3b24ndCBiZSByZWFsXG5cdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG5cdFx0bGV0IGFzcGVjdCA9IGNhbnZhcy53aWR0aCAvIGNhbnZhcy5oZWlnaHQ7XG5cdFx0bGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XG5cblx0XHRnbC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdGdsLmNsZWFyQ29sb3IoMCwgMCwgMCwgMSk7XG5cdFx0Z2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG5cblx0XHQvLyBnZXQgdGhlIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVyIHNvdXJjZVxuXHRcdGxldCB2ID0gdGhpcy5vcHRpb25zLmJlbmNobWFya1ZlcnRleFNoYWRlcjtcblx0XHRsZXQgZiA9IHRoaXMub3B0aW9ucy5iZW5jaG1hcmtGcmFnbWVudFNoYWRlcjtcblxuXHRcdC8vIGNvbXBpbGUgYW5kIGxpbmsgdGhlIHNoYWRlcnNcblx0XHRsZXQgdnMgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG5cdFx0Z2wuc2hhZGVyU291cmNlKHZzLCB2KTtcblx0XHRnbC5jb21waWxlU2hhZGVyKHZzKTtcblxuXHRcdGxldCBmcyA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuXHRcdGdsLnNoYWRlclNvdXJjZShmcywgZik7XG5cdFx0Z2wuY29tcGlsZVNoYWRlcihmcyk7XG5cblx0XHRsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcblx0XHRnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpO1xuXHRcdGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcyk7XG5cdFx0Z2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cblx0XHQvLyBkZWJ1ZyBzaGFkZXIgY29tcGlsZSBzdGF0dXNcblx0XHRsZXQgZXJyb3IgPSBmYWxzZTtcblx0XHRpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcih2cywgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG5cdFx0XHRlcnJvciA9IHRydWU7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGdsLmdldFNoYWRlckluZm9Mb2codnMpKTtcblx0XHR9XG5cblx0XHRpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihmcywgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG5cdFx0XHRlcnJvciA9IHRydWU7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGdsLmdldFNoYWRlckluZm9Mb2coZnMpKTtcblx0XHR9XG5cblx0XHRpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG5cdFx0XHRlcnJvciA9IHRydWU7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pKTtcblx0XHR9XG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHQvLyByZW1vdmUgY2FudmFzIGZyb20gRE9NXG5cdFx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGNhbnZhcyk7XG5cblx0XHRcdHRoaXMuYmVuY2htYXJrRlBTID0gMDtcblx0XHRcdHRoaXMuY3VycmVudFF1YWxpdHlWYWx1ZSA9IC0xO1xuXHRcdFx0dGhpcy5jdXJyZW50UXVhbGl0eU5hbWUgPSAnJztcblxuXHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdGNhbGxiYWNrKHRoaXMuYmVuY2htYXJrRlBTLCB0aGlzLmN1cnJlbnRRdWFsaXR5TmFtZSwgdGhpcy5jdXJyZW50UXVhbGl0eVZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIGdsLmdldFBhcmFtZXRlciggZ2xFeHRlbnNpb25EZWJ1Z1JlbmRlcmVySW5mby5VTk1BU0tFRF9SRU5ERVJFUl9XRUJHTCApXG5cdFx0Ly8gZ2wuZ2V0UGFyYW1ldGVyKCBnbEV4dGVuc2lvbkRlYnVnUmVuZGVyZXJJbmZvLlVOTUFTS0VEX1ZFTkRPUl9XRUJHTCApXG5cblx0XHRsZXQgZmlyc3RUaW1lID0gRGF0ZS5ub3coKTtcblx0XHRsZXQgbmJGcmFtZXMgPSAwO1xuXHRcdChmID0gKCkgPT4ge1xuXHRcdFx0bmJGcmFtZXMrKztcblxuXHRcdFx0Ly8gY3JlYXRlIHZlcnRpY2VzIHRvIGZpbGwgdGhlIGNhbnZhcyB3aXRoIGEgc2luZ2xlIHF1YWRcblx0XHRcdGxldCB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQtMSwgMSAqIGFzcGVjdCwgMSwgMSAqIGFzcGVjdCwgMSwgLTEgKiBhc3BlY3QsXG5cdFx0XHRcdFx0LTEsIDEgKiBhc3BlY3QsIDEsIC0xICogYXNwZWN0LCAtMSwgLTEgKiBhc3BlY3Rcblx0XHRcdFx0XSk7XG5cblx0XHRcdGxldCB2YnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG5cdFx0XHRnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmJ1ZmZlcik7XG5cdFx0XHRnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcblxuXHRcdFx0bGV0IHRyaUNvdW50ID0gMixcblx0XHRcdFx0bnVtSXRlbXMgPSB2ZXJ0aWNlcy5sZW5ndGggLyB0cmlDb3VudDtcblxuXHRcdFx0Z2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcblxuXHRcdFx0bGV0IHRpbWUgPSAoRGF0ZS5ub3coKSAtIGZpcnN0VGltZSkgLyAxMDAwLjA7XG5cdFx0XHQvL3Byb2dyYW0udGltZSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInRpbWVcIik7XG5cdFx0XHQvL2dsLnVuaWZvcm0xZihwcm9ncmFtLnRpbWUsIHRpbWUpO1xuXHRcdFx0cHJvZ3JhbS5yZXNvbHV0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwiaVJlc29sdXRpb25cIik7XG5cdFx0XHRnbC51bmlmb3JtMmYocHJvZ3JhbS5yZXNvbHV0aW9uLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRwcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYVZlcnRleFBvc2l0aW9uXCIpO1xuXHRcdFx0Z2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocHJvZ3JhbS5hVmVydGV4UG9zaXRpb24pO1xuXHRcdFx0Z2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiwgdHJpQ291bnQsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cblx0XHRcdGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCBudW1JdGVtcyk7XG5cblx0XHRcdGlmICh0aW1lID49IHRoaXMub3B0aW9ucy5iZW5jaG1hcmtEdXJhdGlvbikge1xuXHRcdFx0XHQvLyByZW1vdmUgY2FudmFzIGZyb20gRE9NXG5cdFx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoY2FudmFzKTtcblxuXHRcdFx0XHR0aGlzLmJlbmNobWFya0ZQUyA9IG5iRnJhbWVzIC8gdGltZTtcblx0XHRcdFx0dGhpcy5jdXJyZW50UXVhbGl0eVZhbHVlID0gdGhpcy5fZ2V0UXVhbGl0eVZhbHVlKHRoaXMuYmVuY2htYXJrRlBTKTtcblx0XHRcdFx0dGhpcy5jdXJyZW50UXVhbGl0eU5hbWUgPSB0aGlzLl9nZXRRdWFsaXR5TmFtZSh0aGlzLmN1cnJlbnRRdWFsaXR5VmFsdWUpO1xuXG5cdFx0XHRcdGlmIChjYWxsYmFjaykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKHRoaXMuYmVuY2htYXJrRlBTLCB0aGlzLmN1cnJlbnRRdWFsaXR5TmFtZSwgdGhpcy5jdXJyZW50UXVhbGl0eVZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGYpO1xuXHRcdFx0fVxuXHRcdH0pKCk7XG5cblx0XHRyZXR1cm4gY2FudmFzO1xuXHR9XG5cblx0aXNXZWJHTGVuYWJsZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMud2ViR0xlbmFibGVkO1xuXHR9XG5cblx0aXNIYXJkd2FyZUFjY2VsZXJhdGVkKCkge1xuXHRcdHJldHVybiB0aGlzLmhhcmR3YXJlQWNjZWxlcmF0ZWQ7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYkdMUXVhbGlmaWVyO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBcIi8vIHNpbXBsZSByYXl0cmFjaW5nIGV4YW1wbGVcXG4vLyBhIHNwaGVyZSArIGEgcGxhbmVcXG4vLyBpZiBpdCdzIGhhcmQgdG8gZGVhbCB3aXRoIHRoaXMgc2hhZGVyLCBiZSBhc3N1cmVkIHlvdXIgZ2MgaXMgc2xvdy4uLlxcblxcbiNpZmRlZiBHTF9FU1xcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcXG4jZW5kaWZcXG5cXG51bmlmb3JtIHZlYzIgaVJlc29sdXRpb247XFxuXFxuLy92b2lkIG1haW4oKSB7IGdsX0ZyYWdDb2xvciA9IHZlYzQoMS4wKTsgfVxcblxcbmZsb2F0IHNkUGxhbmUodmVjMyBwKSB7XFxuICAgIHJldHVybiBwLnk7XFxufVxcblxcbmZsb2F0IHNkU3BoZXJlKHZlYzMgcCwgZmxvYXQgcykge1xcbiAgICByZXR1cm4gbGVuZ3RoKHApIC0gcztcXG59XFxuXFxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXFxuXFxudmVjMiBvcFUoIHZlYzIgZDEsIHZlYzIgZDIgKSB7XFxuICAgIHJldHVybiAoZDEueDxkMi54KSA/IGQxIDogZDI7XFxufVxcblxcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcblxcbnZlYzIgbWFwKGluIHZlYzMgcG9zKSB7XFxuICAgIHJldHVybiBvcFUodmVjMihzZFBsYW5lKHBvcyksIDEuMCksIHZlYzIoc2RTcGhlcmUocG9zIC0gdmVjMygwLjAsMC4yNSwgMC4wKSwgMC4yNSksIDQ2LjkpKTtcXG59XFxuXFxudmVjMiBjYXN0UmF5KCBpbiB2ZWMzIHJvLCBpbiB2ZWMzIHJkICkge1xcbiAgICBmbG9hdCB0bWluID0gMS4wO1xcbiAgICBmbG9hdCB0bWF4ID0gMjAuMDtcXG5cXG4gICAgZmxvYXQgcHJlY2lzID0gMC4wMDI7XFxuICAgIGZsb2F0IHQgPSB0bWluO1xcbiAgICBmbG9hdCBtID0gLTEuMDtcXG4gICAgZm9yKCBpbnQgaT0wOyBpPDUwOyBpKysgKSB7XFxuICAgICAgICB2ZWMyIHJlcyA9IG1hcCggcm8rcmQqdCApO1xcbiAgICAgICAgaWYoIHJlcy54PHByZWNpcyB8fCB0PnRtYXggKSBicmVhaztcXG4gICAgICAgIHQgKz0gcmVzLng7XFxuICAgICAgICBtID0gcmVzLnk7XFxuICAgIH1cXG5cXG4gICAgaWYoIHQ+dG1heCApIG09LTEuMDtcXG4gICAgcmV0dXJuIHZlYzIoIHQsIG0gKTtcXG59XFxuXFxuZmxvYXQgc29mdHNoYWRvdyggaW4gdmVjMyBybywgaW4gdmVjMyByZCwgaW4gZmxvYXQgbWludCwgaW4gZmxvYXQgdG1heCApIHtcXG4gICAgZmxvYXQgcmVzID0gMS4wO1xcbiAgICBmbG9hdCB0ID0gbWludDtcXG4gICAgZm9yKCBpbnQgaT0wOyBpPDE2OyBpKysgKVxcbiAgICB7XFxuICAgICAgICBmbG9hdCBoID0gbWFwKCBybyArIHJkKnQgKS54O1xcbiAgICAgICAgcmVzID0gbWluKCByZXMsIDguMCpoL3QgKTtcXG4gICAgICAgIHQgKz0gY2xhbXAoIGgsIDAuMDIsIDAuMTAgKTtcXG4gICAgICAgIGlmKCBoPDAuMDAxIHx8IHQ+dG1heCApIGJyZWFrO1xcbiAgICB9XFxuICAgIHJldHVybiBjbGFtcCggcmVzLCAwLjAsIDEuMCApO1xcblxcbn1cXG5cXG52ZWMzIGNhbGNOb3JtYWwoIGluIHZlYzMgcG9zICkge1xcbiAgICB2ZWMzIGVwcyA9IHZlYzMoIDAuMDAxLCAwLjAsIDAuMCApO1xcbiAgICB2ZWMzIG5vciA9IHZlYzMoXFxuICAgIG1hcChwb3MrZXBzLnh5eSkueCAtIG1hcChwb3MtZXBzLnh5eSkueCxcXG4gICAgbWFwKHBvcytlcHMueXh5KS54IC0gbWFwKHBvcy1lcHMueXh5KS54LFxcbiAgICBtYXAocG9zK2Vwcy55eXgpLnggLSBtYXAocG9zLWVwcy55eXgpLnggKTtcXG4gICAgcmV0dXJuIG5vcm1hbGl6ZShub3IpO1xcbn1cXG5cXG5mbG9hdCBjYWxjQU8oIGluIHZlYzMgcG9zLCBpbiB2ZWMzIG5vciApIHtcXG4gICAgZmxvYXQgb2NjID0gMC4wO1xcbiAgICBmbG9hdCBzY2EgPSAxLjA7XFxuICAgIGZvciggaW50IGk9MDsgaTw1OyBpKysgKVxcbiAgICB7XFxuICAgICAgICBmbG9hdCBociA9IDAuMDEgKyAwLjEyKmZsb2F0KGkpLzQuMDtcXG4gICAgICAgIHZlYzMgYW9wb3MgPSAgbm9yICogaHIgKyBwb3M7XFxuICAgICAgICBmbG9hdCBkZCA9IG1hcCggYW9wb3MgKS54O1xcbiAgICAgICAgb2NjICs9IC0oZGQtaHIpKnNjYTtcXG4gICAgICAgIHNjYSAqPSAwLjk1O1xcbiAgICB9XFxuICAgIHJldHVybiBjbGFtcCggMS4wIC0gMy4wKm9jYywgMC4wLCAxLjAgKTtcXG59XFxuXFxudmVjMyByZW5kZXIoIGluIHZlYzMgcm8sIGluIHZlYzMgcmQgKSB7XFxuICAgIHZlYzMgY29sID0gdmVjMygwLjcsIDAuOSwgMS4wKSArcmQueSowLjg7XFxuICAgIHZlYzIgcmVzID0gY2FzdFJheShybyxyZCk7XFxuICAgIGZsb2F0IHQgPSByZXMueDtcXG4gICAgZmxvYXQgbSA9IHJlcy55O1xcbiAgICBpZiggbT4tMC41ICkge1xcbiAgICAgICAgdmVjMyBwb3MgPSBybyArIHQqcmQ7XFxuICAgICAgICB2ZWMzIG5vciA9IGNhbGNOb3JtYWwoIHBvcyApO1xcbiAgICAgICAgdmVjMyByZWYgPSByZWZsZWN0KCByZCwgbm9yICk7XFxuXFxuICAgICAgICAvLyBtYXRlcmlhbFxcbiAgICAgICAgY29sID0gMC40NSArIDAuMypzaW4oIHZlYzMoMC4wNSwwLjA4LDAuMTApKihtLTEuMCkgKTtcXG5cXG4gICAgICAgIGlmKCBtPDEuNSApXFxuICAgICAgICB7XFxuICAgICAgICAgICAgZmxvYXQgZiA9IG1vZCggZmxvb3IoNS4wKnBvcy56KSArIGZsb29yKDUuMCpwb3MueCksIDIuMCk7XFxuICAgICAgICAgICAgY29sID0gMC40ICsgMC4xKmYqdmVjMygxLjApO1xcbiAgICAgICAgfVxcblxcbiAgICAgICAgLy8gbGlnaGl0bmdcXG4gICAgICAgIGZsb2F0IG9jYyA9IGNhbGNBTyggcG9zLCBub3IgKTtcXG4gICAgICAgIHZlYzMgIGxpZyA9IG5vcm1hbGl6ZSggdmVjMygtMC42LCAwLjcsIC0wLjUpICk7XFxuICAgICAgICBmbG9hdCBhbWIgPSBjbGFtcCggMC41KzAuNSpub3IueSwgMC4wLCAxLjAgKTtcXG4gICAgICAgIGZsb2F0IGRpZiA9IGNsYW1wKCBkb3QoIG5vciwgbGlnICksIDAuMCwgMS4wICk7XFxuICAgICAgICBmbG9hdCBiYWMgPSBjbGFtcCggZG90KCBub3IsIG5vcm1hbGl6ZSh2ZWMzKC1saWcueCwwLjAsLWxpZy56KSkpLCAwLjAsIDEuMCApKmNsYW1wKCAxLjAtcG9zLnksMC4wLDEuMCk7XFxuICAgICAgICBmbG9hdCBkb20gPSBzbW9vdGhzdGVwKCAtMC4xLCAwLjEsIHJlZi55ICk7XFxuICAgICAgICBmbG9hdCBmcmUgPSBwb3coIGNsYW1wKDEuMCtkb3Qobm9yLHJkKSwwLjAsMS4wKSwgMi4wICk7XFxuICAgICAgICBmbG9hdCBzcGUgPSBwb3coY2xhbXAoIGRvdCggcmVmLCBsaWcgKSwgMC4wLCAxLjAgKSwxNi4wKTtcXG5cXG4gICAgICAgIGRpZiAqPSBzb2Z0c2hhZG93KCBwb3MsIGxpZywgMC4wMiwgMi41ICk7XFxuICAgICAgICBkb20gKj0gc29mdHNoYWRvdyggcG9zLCByZWYsIDAuMDIsIDIuNSApO1xcblxcbiAgICAgICAgdmVjMyBsaW4gPSB2ZWMzKDAuMCk7XFxuICAgICAgICBsaW4gKz0gMS4yMCpkaWYqdmVjMygxLjAwLDAuODUsMC41NSk7XFxuICAgICAgICBsaW4gKz0gMS4yMCpzcGUqdmVjMygxLjAwLDAuODUsMC41NSkqZGlmO1xcbiAgICAgICAgbGluICs9IDAuMjAqYW1iKnZlYzMoMC41MCwwLjcwLDEuMDApKm9jYztcXG4gICAgICAgIGxpbiArPSAwLjMwKmRvbSp2ZWMzKDAuNTAsMC43MCwxLjAwKSpvY2M7XFxuICAgICAgICBsaW4gKz0gMC4zMCpiYWMqdmVjMygwLjI1LDAuMjUsMC4yNSkqb2NjO1xcbiAgICAgICAgbGluICs9IDAuNDAqZnJlKnZlYzMoMS4wMCwxLjAwLDEuMDApKm9jYztcXG4gICAgICAgIGNvbCA9IGNvbCpsaW47XFxuXFxuICAgICAgICBjb2wgPSBtaXgoIGNvbCwgdmVjMygwLjgsMC45LDEuMCksIDEuMC1leHAoIC0wLjAwMip0KnQgKSApO1xcblxcbiAgICB9XFxuXFxuICAgIHJldHVybiB2ZWMzKCBjbGFtcChjb2wsMC4wLDEuMCkgKTtcXG59XFxuXFxubWF0MyBzZXRDYW1lcmEoIGluIHZlYzMgcm8sIGluIHZlYzMgdGEsIGZsb2F0IGNyICkge1xcbiAgICB2ZWMzIGN3ID0gbm9ybWFsaXplKHRhLXJvKTtcXG4gICAgdmVjMyBjcCA9IHZlYzMoc2luKGNyKSwgY29zKGNyKSwwLjApO1xcbiAgICB2ZWMzIGN1ID0gbm9ybWFsaXplKCBjcm9zcyhjdyxjcCkgKTtcXG4gICAgdmVjMyBjdiA9IG5vcm1hbGl6ZSggY3Jvc3MoY3UsY3cpICk7XFxuICAgIHJldHVybiBtYXQzKCBjdSwgY3YsIGN3ICk7XFxufVxcblxcbnZvaWQgbWFpbigpIHtcXG4gICAgdmVjMiBxID0gZ2xfRnJhZ0Nvb3JkLnh5L2lSZXNvbHV0aW9uLnh5O1xcbiAgICB2ZWMyIHAgPSAtMS4wKzIuMCpxO1xcbiAgICBwLnggKj0gaVJlc29sdXRpb24ueC9pUmVzb2x1dGlvbi55O1xcblxcbiAgICBmbG9hdCB0aW1lID0gMTUuMDsvLyArIGlHbG9iYWxUaW1lO1xcblxcbiAgICAvLyBjYW1lcmFcXG4gICAgdmVjMyBybyA9IHZlYzMoLTAuNSsxLjUqY29zKDAuMSp0aW1lKSwgMS4wLCAtMC41ICsgMS41KnNpbigwLjEqdGltZSkpO1xcbiAgICB2ZWMzIHRhID0gdmVjMygwLjAsIDAuMCwgMC4wKTtcXG5cXG4gICAgLy8gY2FtZXJhLXRvLXdvcmxkIHRyYW5zZm9ybWF0aW9uXFxuICAgIG1hdDMgY2EgPSBzZXRDYW1lcmEoIHJvLCB0YSwgMC4wICk7XFxuXFxuICAgIC8vIHJheSBkaXJlY3Rpb25cXG4gICAgdmVjMyByZCA9IGNhICogbm9ybWFsaXplKCB2ZWMzKHAueHksMi4wKSApO1xcblxcbiAgICAvLyByZW5kZXJcXG4gICAgdmVjMyBjb2wgPSByZW5kZXIoIHJvLCByZCApO1xcblxcbiAgICBjb2wgPSBwb3coIGNvbCwgdmVjMygwLjQ1NDUpICk7XFxuXFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoY29sLCAxLjApO1xcbn1cXG5cIjtcbiIsIm1vZHVsZS5leHBvcnRzID0gXCJhdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICBnbF9Qb3NpdGlvbiA9IHZlYzQoYVZlcnRleFBvc2l0aW9uLCAwLjAsIDEuMCk7XFxufVxcblwiO1xuIl19
