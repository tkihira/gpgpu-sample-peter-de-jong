;(function() {
	var config = {
		size: 512,
		glSize: 512 * 2,
		a: -2.7,
		b: -0.09,
		c: -0.86,
		d: -2.2,
		random: true
	};
	var status = {};
	var gl;
	onload = function() {
		initialize();
		glInitialize();
		var dataCanvas = createData();
		glSetTexture(dataCanvas);
		(function tick() {
			glDraw();
			glGetData();
			showData();
			glSetTexture(status.getterCanvas);
			setTimeout(tick, 0);
		})();
	};
	var initialize = function() {
		status.bin = [];
		for(var i = 0; i < config.size * config.size; i++) {
			status.bin[i] = 0;
		}
		status.counter = 0;
		if(config.random) {
			config.a = Math.random() * 4 - 2;
			config.b = Math.random() * 4 - 2;
			config.c = Math.random() * 4 - 2;
			config.d = Math.random() * 4 - 2;
		}
		status.ragian = Math.random() * Math.PI * 2;
	};
	var glInitialize = function() {
		var option = { premultipliedAlpha: false };
		var canvas = document.createElement("canvas");
		canvas.width = config.glSize;
		canvas.height = config.glSize * 2;
		gl = canvas.getContext("experimental-webgl", option) || canvas.getContext("webgl", option);
		if(!gl) {
			document.write("this browser does not support webgl.");
			return;
		}

		var vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, document.getElementById("vs").text);
		gl.compileShader(vs);
		if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
			console.log("vs compile error\n" + gl.getShaderInfoLog(vs));
			return;
		}

		var fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, document.getElementById("fs").text);
		gl.compileShader(fs);
		if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
			console.log("fs compile error\n" + gl.getShaderInfoLog(fs));
			return;
		}

		var prog = gl.createProgram();
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			console.log("link error\n" + gl.getProgramInfoLog(prog));
			return;
		}
		gl.useProgram(prog);
		status.prog = prog;

		var buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
		status.buf = buf;
	};
	var createData = function() {
		var canvas = document.createElement("canvas");
		canvas.width = canvas.height = config.glSize;
		var ctx = canvas.getContext("2d");
		var imageData = ctx.createImageData(config.glSize, config.glSize);
		var data = imageData.data;
		for(var i = 0; i < canvas.width * canvas.width; i++) {
			var f = Math.random();
			var v = (f * 0xFFFFFFFF) >>> 0;
			data[i * 4 + 0] = (v >> 24) & 0xFF;
			data[i * 4 + 1] = (v >> 16) & 0xFF;
			data[i * 4 + 2] = (v >> 8) & 0xFF;
			//data[i * 4 + 3] = v & 0xFF;
			data[i * 4 + 3] = 0xFF;
		}
		ctx.putImageData(imageData, 0, 0);
		return canvas;
	};
	var glSetTexture = function(img) {
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		status.tex = tex;
	};
	var glDraw = function() {
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var pos = gl.getAttribLocation(status.prog, "vertex");
		gl.bindBuffer(gl.ARRAY_BUFFER, status.buf);
		gl.vertexAttribPointer(pos, 2, gl.FLOAT, true, 0, 0);
		gl.enableVertexAttribArray(pos);

		gl.uniform4f(gl.getUniformLocation(status.prog, "param"), config.a, config.b, config.c, config.d);
		gl.uniform1f(gl.getUniformLocation(status.prog, "glSize"), config.glSize);

		gl.bindTexture(gl.TEXTURE_2D, status.tex);
		gl.uniform1i(gl.getUniformLocation(status.prog, "texture"), 0);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	};
	var glGetData = function() {
		var canvas = status.getterCanvas;
		if(!canvas) {
			canvas = document.createElement("canvas");
			status.getterCanvas = canvas;
			canvas.width = canvas.height = config.glSize;
		}
		//document.body.appendChild(canvas);
		var ctx = canvas.getContext("2d");
		ctx.drawImage(gl.canvas, 0, config.glSize, config.glSize, config.glSize, 0, 0, config.glSize, config.glSize);
		var data = ctx.getImageData(0, 0, config.glSize, config.glSize).data;
		for(var i = 0; i < config.glSize * config.glSize / 2; i++) {
			var y = data[i * 8 + 0] * 256 + data[i * 8 + 1];
			var x = data[i * 8 + 4] * 256 + data[i * 8 + 5];
			status.bin[x * config.size + y]++;
			status.counter++;
		}
		ctx.drawImage(gl.canvas, 0, 0, config.glSize, config.glSize, 0, 0, config.glSize, config.glSize);
	};
	var makeColor = function(ratio, ragian, f) {
		if(ratio > 1) {
			ratio = 1;
		}
		if(ragian < 0) {
			ragian += Math.PI * 2;
		}
		if(ragian >= Math.PI * 2) {
			ragian -= Math.PI * 2;
		}
		var h1 = (ragian * 3 / Math.PI) | 0;
		var s = 1;
		var f = ragian / (Math.PI / 3) - h1;
		var p = 1 * (1 - s);
		var q = 1 * (1 - f * s);
		var t = 1 * (1 - (1 - f) * s);
		var r, g, b;
		switch(h1) {
			case 0: r = 1; g = t; b = p; break;
			case 1: r = q; g = 1; b = p; break;
			case 2: r = p; g = 1; b = t; break;
			case 3: r = p; g = q; b = 1; break;
			case 4: r = t; g = p; b = 1; break;
			case 5: r = 1; g = p; b = 1; break;
		}
		var c = 1 - Math.pow(1 - ratio, 150);
		return {
			r: (Math.pow(c, 3 - r * 1.5) * 255) | 0,
			g: (Math.pow(c, 3 - g * 1.5) * 255) | 0,
			b: (Math.pow(c, 3 - b * 1.5) * 255) | 0
		};
	};
	var showData = function() {
		var canvas = document.getElementById("canvas");
		//canvas.width = canvas.height = config.size;
		var ctx = canvas.getContext("2d");
		var imageData = ctx.createImageData(config.size, config.size);
		var data = imageData.data;
		for(var i = 0; i < canvas.width * canvas.width; i++) {
			var ratio = status.bin[i] * config.size / status.counter;
			//var c = (status.bin[i] != 0)? 255: 0;
			var c = makeColor(ratio, status.ragian);
			//console.log(c);
			data[i * 4 + 0] = c.r;
			data[i * 4 + 1] = c.b;
			data[i * 4 + 2] = c.b;
			data[i * 4 + 3] = 255;
		}
		ctx.putImageData(imageData, 0, 0);
	};
})();
