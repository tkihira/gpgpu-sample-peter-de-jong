;(function() {
	var gl;
	var prog;
	var img;
	var canvas;
	onload = function() {
		canvas = document.getElementById("canvas");
		if(false) {
			img = document.createElement("img");
			img.onload = initialize;
			img.src = "test.jpg";
			return;
		}
		setData();
		initialize();
	};
	var setData = function() {
		img = document.createElement("canvas");
		img.width = img.height = canvas.width;
		var ctx = img.getContext("2d");
		var imageData = ctx.createImageData(canvas.width, canvas.width);
		var data = imageData.data;
		for(var i = 0; i < canvas.width * canvas.width; i++) {
			var f = Math.random();
			var v = (f * 0xFFFFFFFF) >>> 0;
			data[i *4 + 0] = (v >> 24) & 0xFF;
			data[i *4 + 1] = (v >> 16) & 0xFF;
			data[i *4 + 2] = (v >> 8) & 0xFF;
			data[i *4 + 3] = v & 0xFF;
			data[i *4 + 3] = 0xFF;
			/*
			if(i < 2) {
				console.log(f * 4 - 2);
				console.log(data[i*4+0],data[i*4+1],data[i*4+2],data[i*4+3]);
			}
			*/
		}
		ctx.putImageData(imageData, 0, 0);
	};
	var initialize = function() {
		//document.body.appendChild(img);
		var option = { premultipliedAlpha: false };
		gl = canvas.getContext("experimental-webgl", option) || canvas.getContext("webgl", option);
		if(!gl) {
			document.write("your browser does not support webgl");
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

		prog = gl.createProgram();
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			console.log("link error\n" + gl.getProgramInfoLog(prog));
			return;
		}
		gl.useProgram(prog);

		loadBuffer();
		drawFrame();
		getData();
	};
	var buf;
	var tex;
	var loadBuffer = function() {
		buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
		
		tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	var drawFrame = function() {
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var pos = gl.getAttribLocation(prog, "vertex");
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.vertexAttribPointer(pos, 2, gl.FLOAT, true, 0, 0);
		gl.enableVertexAttribArray(pos);

		gl.uniform4f(gl.getUniformLocation(prog, "param"), -2.7, -0.09, -0.86, -2.2);

		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.uniform1i(gl.getUniformLocation(prog, "texture"), 0);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	};

	var bin = [];
	var getData = function() {
		var dc = document.createElement("canvas");
		dc.width = dc.height = canvas.width;
		var ctx = dc.getContext("2d");
		ctx.drawImage(canvas, 0, 512, 512, 512, 0, 0, 512, 512);
		document.body.appendChild(dc);
		var data = ctx.getImageData(0, 0, canvas.width, canvas.width).data;
		for(var i= 0; i< 2; i++) {
			var value = 0;
			value += data[i* 4 + 0] * 0x1000000;
			value += data[i* 4 + 1] * 0x10000;
			value += data[i* 4 + 2] * 0x100;
			value += data[i* 4 + 3];
			console.log((value / 0xFFFFFFFF) * 4 - 2);
			console.log(data[i*4+0],data[i*4+1],data[i*4+2],data[i*4+3]);
		}
	};
})();
