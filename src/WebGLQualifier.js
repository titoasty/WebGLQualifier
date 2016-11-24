import vertexShader from './shader/default.vertex.glsl';
import fragmentShader from './shader/default.fragment.glsl';

class WebGLQualifier {

	constructor(options) {
		this.options = Object.assign({}, {
			benchmarkDuration: 2,
			benchmarkVertexShader: vertexShader,
			benchmarkFragmentShader: fragmentShader,
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

	_checkWebGLEnabled() {
		if (!!window.WebGLRenderingContext) {
			let canvas = document.createElement("canvas"),
				names = ["webgl", "experimental-webgl", "moz-webgl"],
				gl = false;

			for (let i in names) {
				try {
					gl = canvas.getContext(names[i]);
					if (gl && typeof gl.getParameter == "function") {
						// WebGL is enabled
						// return true;
						return names[i];
					}
				} catch (e) {
				}
			}

			// WebGL is supported, but disabled
			return false;
		}

		// WebGL not supported
		return false;
	}

	_checkHardwareAccelerated() {
		// check software rendering for IE11
		let isIE11 = /Trident.*rv[ :]*11\./.test(window.navigator.userAgent);

		if (this.enabled && isIE11) {
			let canvas = $('<canvas></canvas>')[0];
			let context = canvas.getContext(this.enabled, {antialias: false, stencil: true, failIfMajorPerformanceCaveat: true});

			// damn, no hardware acceleration !..
			if (context == null) {
				return false;
			}
		}

		return true;
	}

	_getQualityValue(fps) {
		if (!fps) {
			fps = this.benchmarkFPS;
		}

		for (let i = 0; i < this.options.qualityRange.length; i++) {
			if (fps < this.options.qualityRange[i]) {
				return i;
			}
		}

		return this.options.qualityRange.length;
	}

	_getQualityName(qualityIndex) {
		return this.options.qualityNames[qualityIndex];
	}

	// start benchmark
	// return canvas used for benchmark
	benchmark(callback) {
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
		let requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
			function (c) {
				window.setTimeout(c, 15)
			};

		// create webgl context on the canvas element
		let canvas = document.createElement("canvas");
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

		let aspect = canvas.width / canvas.height;
		let gl = canvas.getContext("experimental-webgl");

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		// get the vertex and fragment shader source
		let v = this.options.benchmarkVertexShader;
		let f = this.options.benchmarkFragmentShader;

		// compile and link the shaders
		let vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, v);
		gl.compileShader(vs);

		let fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, f);
		gl.compileShader(fs);

		let program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);

		// debug shader compile status
		let error = false;
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

		let firstTime = Date.now();
		let nbFrames = 0;
		(f = () => {
			nbFrames++;

			// create vertices to fill the canvas with a single quad
			let vertices = new Float32Array(
				[
					-1, 1 * aspect, 1, 1 * aspect, 1, -1 * aspect,
					-1, 1 * aspect, 1, -1 * aspect, -1, -1 * aspect
				]);

			let vbuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

			let triCount = 2,
				numItems = vertices.length / triCount;

			gl.useProgram(program);

			let time = (Date.now() - firstTime) / 1000.0;
			//program.time = gl.getUniformLocation(program, "time");
			//gl.uniform1f(program.time, time);
			program.resolution = gl.getUniformLocation(program, "iResolution");
			gl.uniform2f(program.resolution, canvas.width, canvas.height);

			program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
			gl.enableVertexAttribArray(program.aVertexPosition);
			gl.vertexAttribPointer(program.aVertexPosition, triCount, gl.FLOAT, false, 0, 0);

			gl.drawArrays(gl.TRIANGLES, 0, numItems);

			if (time >= this.options.benchmarkDuration) {
				// remove canvas from DOM
				document.body.removeChild(canvas);

				this.benchmarkFPS = nbFrames / time;
				this.currentQualityValue = this._getQualityValue(this.benchmarkFPS);
				this.currentQualityName = this._getQualityName(this.currentQualityValue);

				if (callback) {
					callback(this.benchmarkFPS, this.currentQualityName, this.currentQualityValue);
				}
			} else {
				requestAnimationFrame(f);
			}
		})();

		return canvas;
	}

	isWebGLenabled() {
		return this.webGLenabled;
	}

	isHardwareAccelerated() {
		return this.hardwareAccelerated;
	}

}

module.exports = WebGLQualifier;
