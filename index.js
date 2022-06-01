

main();

function NormalisedToDevice( coord, axisSize )
{
	var halfAxisSize = axisSize / 2;

	var deviceCoord = ( coord + 1 ) * halfAxisSize;

	return deviceCoord;
}

function DeviceToNormalised( coord, axisSize )
{
	var halfAxisSize = axisSize / 2;

	var normalisedCoord = ( coord / halfAxisSize ) - 1;

	return normalisedCoord;
}

function main( )
{
	const canvas = document.querySelector( "#glcanvas" );
	
	const gl = canvas.getContext( "webgl" );

	if ( !gl )
	{
		alert( "Unable to setup WebGL. Your browser or computer may not support it." );

		return;
	}
	// Informações necessárias para formação do cubo
	var vertices = [
    	-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1,
    	-1,-1,1, 1,-1,1, 1,1,1, -1,1, 1,
    	-1,-1,-1, -1,1,-1, -1,1,1, -1,-1,1,
    	1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1,
    	-1,-1,-1, -1,-1,1, 1,-1,1, 1,-1,-1,
    	-1,1,-1, -1,1,1, 1,1,1, 1,1,-1, 
    ];

    var colors = [
    	5,3,7, 5,3,7, 5,3,7, 5,3,7,
    	1,1,3, 1,1,3, 1,1,3, 1,1,3,
    	0,0,1, 0,0,1, 0,0,1, 0,0,1,
    	1,0,0, 1,0,0, 1,0,0, 1,0,0,
    	1,1,0, 1,1,0, 1,1,0, 1,1,0,
    	0,1,0, 0,1,0, 0,1,0, 0,1,0
    ];

    var indices = [
    	0,1,2, 0,2,3, 4,5,6, 4,6,7,
    	8,9,10, 8,10,11, 12,13,14, 12,14,15,
    	16,17,18, 16,18,19, 20,21,22, 20,22,23 
    ];

	var vertex_buffer = gl.createBuffer( );

	gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );

	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, null );

	var color_buffer = gl.createBuffer ();
    gl.bindBuffer( gl.ARRAY_BUFFER, color_buffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( colors ), gl.STATIC_DRAW );

	// Create an empty buffer object to store Index buffer
    var index_buffer = gl.createBuffer( );

    // Bind appropriate array buffer to it
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, index_buffer );

    // Pass the vertex data to the buffer
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array (indices ), gl.STATIC_DRAW );
    
    // Unbind the buffer
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );

	var vertCode = 
		'attribute vec3 position;'+
        'uniform mat4 Pmatrix;'+
        'uniform mat4 Vmatrix;'+
        'uniform mat4 Mmatrix;'+
        'attribute vec3 color;'+
        'varying vec3 vColor;'+

        'void main( void )'+
        '{' +
           'gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4( position, 1.0 );'+
           'vColor = color;'+
        '}'
    ;

	var vertShader = gl.createShader( gl.VERTEX_SHADER );

	gl.shaderSource( vertShader, vertCode );

	gl.compileShader( vertShader );

	var fragCode = 
		'precision mediump float;'+
        'varying vec3 vColor;'+
        'void main( void )'+
        '{' +
        	'gl_FragColor = vec4( vColor, 1.0 );'+
		'}'
	;

	var fragShader = gl.createShader( gl.FRAGMENT_SHADER );

	gl.shaderSource( fragShader, fragCode );

	gl.compileShader( fragShader );

	var shaderProgram = gl.createProgram( );

	gl.attachShader( shaderProgram, vertShader );

	gl.attachShader( shaderProgram, fragShader );

	gl.linkProgram( shaderProgram );

	gl.useProgram( shaderProgram );

	/* ====== Associating attributes to vertex shader =====*/
    var Pmatrix = gl.getUniformLocation( shaderProgram, "Pmatrix" );
    var Vmatrix = gl.getUniformLocation( shaderProgram, "Vmatrix" );
    var Mmatrix = gl.getUniformLocation( shaderProgram, "Mmatrix" );

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var position = gl.getAttribLocation( shaderProgram, "position" );
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0,0) ;

    // Position Buffer Binding
    gl.enableVertexAttribArray( position );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, color_buffer );
    var color = gl.getAttribLocation( shaderProgram, "color");
    gl.vertexAttribPointer( color, 3, gl.FLOAT, false,0,0 ) ;

    // Color Buffer Binding
    gl.enableVertexAttribArray( color );
    gl.useProgram( shaderProgram );

    /*==================== MATRIX =====================*/

    function get_projection( angle, a, zMin, zMax )
    {
       var ang = Math.tan( ( angle * 0.5 ) * Math.PI / 180 );
       
       return [
          0.5 / ang, 0 , 0, 0,
          0, 0.5 * a / ang, 0, 0,
          0, 0, - ( zMax + zMin ) / ( zMax - zMin ), -1,
          0, 0, ( -2 * zMax * zMin ) / ( zMax - zMin ), 0 
       ];
    }

    var proj_matrix = get_projection( 40, canvas.width / canvas.height, 1, 100) ;

    var mov_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    var view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

    // Translating z
    view_matrix[14] = view_matrix[14] - 6;

	

    /*==================== Rotation ====================*/

    function rotateY( m, angle )
    {
    	var c = Math.cos( angle );
    	var s = Math.sin( angle );
    	var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    	m[0] = c * m[0] + s * m[2];
    	m[4] = c * m[4] + s * m[6];
    	m[8] = c * m[8] + s * m[10];

    	m[2] = c * m[2] - s * mv0;
    	m[6] = c * m[6] - s * mv4;
    	m[10] = c * m[10] - s * mv8;
    }

    function rotateZ( m, angle )
    {
    	var c = Math.cos( angle );
    	var s = Math.sin( angle );
    	var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    	m[0] = c * m[0] - s * m[1];
    	m[4] = c * m[4] - s * m[5];
    	m[8] = c * m[8] - s * m[9];

    	m[1]=c * m[1] + s * mv0;
    	m[5]=c * m[5] + s * mv4;
    	m[9]=c * m[9] + s * mv8;
    }

    var drawScene = function()
    {

    	gl.enable( gl.DEPTH_TEST );
    	gl.depthFunc( gl.LEQUAL );
    	gl.clearColor( 0.5, 0.5, 0.5, 0.9 );
    	gl.clearDepth( 1.0 );

    	gl.viewport( 0.0, 0.0, canvas.width, canvas.height );
    	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    	gl.uniformMatrix4fv( Pmatrix, false, proj_matrix );
    	gl.uniformMatrix4fv( Vmatrix, false, view_matrix );
    	gl.uniformMatrix4fv( Mmatrix, false, mov_matrix );
    	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, index_buffer );
    	gl.drawElements( gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );

    }

    drawScene();
}

main( );

function NormalisedToDevice( coord, axisSize )
{
	var halfAxisSize = axisSize / 2;

	var deviceCoord = ( coord + 1 ) * halfAxisSize;

	return deviceCoord;
}

function DeviceToNormalised( coord, axisSize )
{
	var halfAxisSize = axisSize / 2;

	var normalisedCoord = ( coord / halfAxisSize ) - 1;

	return normalisedCoord;
}

function main( )
{
	const canvas = document.querySelector( "#glcanvas" );
	
	
	const gl = canvas.getContext( "webgl" );

	if ( !gl )
	{
		alert( "Unable to setup WebGL. Your browser or computer may not support it." );

		return;
	}

	var vertices = [
    	-1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1,
    	-1,-1,1, 1,-1,1, 1,1,1, -1,1, 1,
    	-1,-1,-1, -1,1,-1, -1,1,1, -1,-1,1,
    	1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1,
    	-1,-1,-1, -1,-1,1, 1,-1,1, 1,-1,-1,
    	-1,1,-1, -1,1,1, 1,1,1, 1,1,-1, 
    ];

    var colors = [
    	5,3,7, 5,3,7, 5,3,7, 5,3,7,
    	1,1,3, 1,1,3, 1,1,3, 1,1,3,
    	0,0,1, 0,0,1, 0,0,1, 0,0,1,
    	1,0,0, 1,0,0, 1,0,0, 1,0,0,
    	1,1,0, 1,1,0, 1,1,0, 1,1,0,
    	0,1,0, 0,1,0, 0,1,0, 0,1,0
    ];

    var indices = [
    	0,1,2, 0,2,3, 4,5,6, 4,6,7,
    	8,9,10, 8,10,11, 12,13,14, 12,14,15,
    	16,17,18, 16,18,19, 20,21,22, 20,22,23 
    ];

	var vertex_buffer = gl.createBuffer( );

	gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );

	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, null );

	var color_buffer = gl.createBuffer ();
    gl.bindBuffer( gl.ARRAY_BUFFER, color_buffer );
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( colors ), gl.STATIC_DRAW );

	// Create an empty buffer object to store Index buffer
    var index_buffer = gl.createBuffer( );

    // Bind appropriate array buffer to it
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, index_buffer );

    // Pass the vertex data to the buffer
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array (indices ), gl.STATIC_DRAW );
    
    // Unbind the buffer
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );

	var vertCode = 
		'attribute vec3 position;'+
        'uniform mat4 Pmatrix;'+
        'uniform mat4 Vmatrix;'+
        'uniform mat4 Mmatrix;'+
        'attribute vec3 color;'+
        'varying vec3 vColor;'+

        'void main( void )'+
        '{' +
           'gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4( position, 1.0 );'+
           'vColor = color;'+
        '}'
    ;

	var vertShader = gl.createShader( gl.VERTEX_SHADER );

	gl.shaderSource( vertShader, vertCode );

	gl.compileShader( vertShader );

	var fragCode = 
		'precision mediump float;'+
        'varying vec3 vColor;'+
        'void main( void )'+
        '{' +
        	'gl_FragColor = vec4( vColor, 1.0 );'+
		'}'
	;

	var fragShader = gl.createShader( gl.FRAGMENT_SHADER );

	gl.shaderSource( fragShader, fragCode );

	gl.compileShader( fragShader );

	var shaderProgram = gl.createProgram( );

	gl.attachShader( shaderProgram, vertShader );

	gl.attachShader( shaderProgram, fragShader );

	gl.linkProgram( shaderProgram );

	gl.useProgram( shaderProgram );

	/* ====== Associating attributes to vertex shader =====*/
    var Pmatrix = gl.getUniformLocation( shaderProgram, "Pmatrix" );
    var Vmatrix = gl.getUniformLocation( shaderProgram, "Vmatrix" );
    var Mmatrix = gl.getUniformLocation( shaderProgram, "Mmatrix" );

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var position = gl.getAttribLocation( shaderProgram, "position" );
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0,0) ;

    // Position Buffer Binding
    gl.enableVertexAttribArray( position );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, color_buffer );
    var color = gl.getAttribLocation( shaderProgram, "color");
    gl.vertexAttribPointer( color, 3, gl.FLOAT, false,0,0 ) ;

    // Color Buffer Binding
    gl.enableVertexAttribArray( color );
    gl.useProgram( shaderProgram );

    /*==================== MATRIX =====================*/

    function get_projection( angle, a, zMin, zMax )
    {
       var ang = Math.tan( ( angle * 0.5 ) * Math.PI / 180 );
       
       return [
          0.5 / ang, 0 , 0, 0,
          0, 0.5 * a / ang, 0, 0,
          0, 0, - ( zMax + zMin ) / ( zMax - zMin ), -1,
          0, 0, ( -2 * zMax * zMin ) / ( zMax - zMin ), 0 
       ];
    }

    var proj_matrix = get_projection( 40, canvas.width / canvas.height, 1, 100) ;
	
	const originMatrix = [
		1,0,0,0, 
		0,1,0,0, 
		0,0,1,0, 
		0,0,0,1
	];

    var mov_matrix = [
		1,0,0,0, 
		0,1,0,0, 
		0,0,1,0, 
		0,0,0,1
	];
	
    var view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

    // Translating z
    view_matrix[14] = view_matrix[14] - 6;

	/*==================== Operação em Matrizes ====================*/

	var vector4D = {
		multiply: function(a, b) {
			var a00 = a[0 * 4 + 0];
			var a01 = a[0 * 4 + 1];
			var a02 = a[0 * 4 + 2];
			var a03 = a[0 * 4 + 3];
			var a10 = a[1 * 4 + 0];
			var a11 = a[1 * 4 + 1];
			var a12 = a[1 * 4 + 2];
			var a13 = a[1 * 4 + 3];
			var a20 = a[2 * 4 + 0];
			var a21 = a[2 * 4 + 1];
			var a22 = a[2 * 4 + 2];
			var a23 = a[2 * 4 + 3];
			var a30 = a[3 * 4 + 0];
			var a31 = a[3 * 4 + 1];
			var a32 = a[3 * 4 + 2];
			var a33 = a[3 * 4 + 3];
			var b00 = b[0 * 4 + 0];
			var b01 = b[0 * 4 + 1];
			var b02 = b[0 * 4 + 2];
			var b03 = b[0 * 4 + 3];
			var b10 = b[1 * 4 + 0];
			var b11 = b[1 * 4 + 1];
			var b12 = b[1 * 4 + 2];
			var b13 = b[1 * 4 + 3];
			var b20 = b[2 * 4 + 0];
			var b21 = b[2 * 4 + 1];
			var b22 = b[2 * 4 + 2];
			var b23 = b[2 * 4 + 3];
			var b30 = b[3 * 4 + 0];
			var b31 = b[3 * 4 + 1];
			var b32 = b[3 * 4 + 2];
			var b33 = b[3 * 4 + 3];
			return [
			  b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
			  b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
			  b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
			  b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
			  b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
			  b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
			  b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
			  b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
			  b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
			  b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
			  b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
			  b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
			  b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
			  b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
			  b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
			  b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
			];
		}
	}

	/*==================== Matrizes de transformação ====================*/

	var matrixTransform = {
		translation: function(tx, ty, tz) {
		  return [
			 1,  0,  0,  0,
			 0,  1,  0,  0,
			 0,  0,  1,  0,
			 tx, ty, tz, 1,
		  ];
		},
	   
		xRotation: function(angleInRadians) {
		  var c = Math.cos(angleInRadians);
		  var s = Math.sin(angleInRadians);
	   
		  return [
			1, 0, 0, 0,
			0, c, s, 0,
			0, -s, c, 0,
			0, 0, 0, 1,
		  ];
		},
	   
		yRotation: function(angleInRadians) {
		  var c = Math.cos(angleInRadians);
		  var s = Math.sin(angleInRadians);
	   
		  return [
			c, 0, -s, 0,
			0, 1, 0, 0,
			s, 0, c, 0,
			0, 0, 0, 1,
		  ];
		},
	   
		zRotation: function(angleInRadians) {
		  var c = Math.cos(angleInRadians);
		  var s = Math.sin(angleInRadians);
	   
		  return [
			 c, s, 0, 0,
			-s, c, 0, 0,
			 0, 0, 1, 0,
			 0, 0, 0, 1,
		  ];
		},
	   
		scaling: function(sx, sy, sz) {
		  return [
			sx, 0,  0,  0,
			0, sy,  0,  0,
			0,  0, sz,  0,
			0,  0,  0,  1,
		  ];
		},
	  };

    /*==================== Rotacionar Objetos ====================*/

    function rotateX( m, angle)
    {		
		return vector4D.multiply(originMatrix, matrixTransform.xRotation(angle))
    }

    function rotateY( m, angle )
    {
    	return vector4D.multiply(originMatrix, matrixTransform.yRotation(angle));
    }

    function rotateZ( m, angle )
    {
    	return vector4D.multiply(originMatrix, matrixTransform.zRotation(angle));
    }

	/*==================== Desenhar cena ====================*/
	
    var drawScene = function()
    {
    	gl.enable( gl.DEPTH_TEST );
    	gl.depthFunc( gl.LEQUAL );
    	gl.clearColor( 0.5, 0.5, 0.5, 0.9 );
    	gl.clearDepth( 1.0 );

    	gl.viewport( 0.0, 0.0, canvas.width, canvas.height );
    	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    	gl.uniformMatrix4fv( Pmatrix, false, proj_matrix );
    	gl.uniformMatrix4fv( Vmatrix, false, view_matrix );
    	gl.uniformMatrix4fv( Mmatrix, false, mov_matrix );
    	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, index_buffer );
    	gl.drawElements( gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );

    }

    drawScene();
	

	function degreesToRad(angle){
		return angle * Math.PI / 180;
	}

	/*==================== Elementos e eventos da interface gráfica ====================*/
	const rtx = document.getElementById('rotate-x');
	const rty = document.getElementById('rotate-y');
	const rtz = document.getElementById('rotate-z');

	rtx.onchange = function(event){
		const angle = this.value;
		mov_matrix = rotateX( mov_matrix, degreesToRad(angle));
		document.getElementById('rotate-y').value = 0;
		document.getElementById('rotate-z').value = 0;
		drawScene();
	};
	
	rty.onchange = function(event){
		const angle = this.value;
		mov_matrix = rotateY( mov_matrix, degreesToRad(angle));
		document.getElementById('rotate-x').value = 0;
		document.getElementById('rotate-z').value = 0;
		drawScene();
	};

	rtz.onchange = function(event){
		const angle = this.value;
		mov_matrix = rotateZ( mov_matrix, degreesToRad(angle));
		document.getElementById('rotate-y').value = 0;
		document.getElementById('rotate-x').value = 0;
		drawScene();
	};
}























