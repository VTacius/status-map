/* 
 * Accedo a los datos 
 */
var api = '/estado.php';
var tiempoRecarga = 20000;

var obtenerDatos = function(url){
    return new Promise(function(resolve, reject){
        var peticion = new XMLHttpRequest();
        peticion.open('GET', api, true);

        peticion.onreadystatechange = function (){
        	if (this.readyState === 4) {
        		if (this.status >= 200 && this.status < 400) {
          			var datos = JSON.parse(this.responseText);
        			resolve(datos);
                    peticion = null;
        		} else {
          			reject(Error('Hubo un error al intentar acceder a los datos'));
                    peticion = null;
        		}
        	} 
        }
        
        peticion.send();
    });
};

/* 
 * Creo el mapa. El mapa debe ser lo primer en cargar para que el usuario no se sienta mal, so
 */
/* Configurando algunos valores por defecto */
var default_lat = "13.8054";
var default_lng = "-88.9069";
var default_zoom = 10;
var tile_url = "{s}.tile.openstreetmap.org";

/* Esto es básicamente la configuración inicial del mapa */
var mapa = L.map('mapaid').setView([default_lat, default_lng], default_zoom);
L.tileLayer('//' + tile_url + '/{z}/{x}/{y}.png', {
    attribution: '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mapa);

/* Facilita la creación de un titulo para el popup de los marcadores */ 
var creaTituloMarca = function(dataObjeto){
    return '<b>' + dataObjeto.nombre + '</b>:<br>' + 
        'Estado: <b>' + configuraEstado(dataObjeto.estado) + '</b>' +
        ' desde <b>' + dataObjeto.duracion + '</b>'
};

/*
 * Creo los íconos personalizados, algo de mucho valor por acá
 */
var marcas = {};
var data = {};

/* Configuración inicial y común a todos los íconos */
var LeafIcon = L.Icon.extend({
    options: {
        iconSize: [16, 16],
    }
});

/* Los íconos. */
var iconos = {
    hospitales: {
        down: new LeafIcon({iconUrl: 'images/hospitaldown.png'}),
        unk: new LeafIcon({iconUrl: 'images/hospitalunk.png'}),
        up: new LeafIcon({iconUrl: 'images/hospitalup.png'})
    },
    sibasi :  {
        down: new LeafIcon({iconUrl: 'images/sibasidown.png'}),
        unk: new LeafIcon({iconUrl: 'images/sibasiunk.png'}),
        up: new LeafIcon({iconUrl: 'images/sibasiup.png'})
    },
    almacen :  {
        down: new LeafIcon({iconUrl: 'images/almacendown.png'}),
        unk: new LeafIcon({iconUrl: 'images/almacenunk.png'}),
        up: new LeafIcon({iconUrl: 'images/almacenup.png'})
    },
    region :  {
        down: new LeafIcon({iconUrl: 'images/regiondown.png'}),
        unk: new LeafIcon({iconUrl: 'images/regionunk.png'}),
        up: new LeafIcon({iconUrl: 'images/regionup.png'})
    },
    otros :  {
        down: new LeafIcon({iconUrl: 'images/otrosdown.png'}),
        unk: new LeafIcon({iconUrl: 'images/otrosunk.png'}),
        up: new LeafIcon({iconUrl: 'images/otrosup.png'})
    },
    ucsf :  {
        down: new LeafIcon({iconUrl: 'images/ucsfdown.png'}),
        unk: new LeafIcon({iconUrl: 'images/ucsfunk.png'}),
        up: new LeafIcon({iconUrl: 'images/ucsfup.png'})
    }
};

/* Auxiliar para hacer legible los datos que nos envia el servidor para el atributo estado */
var configuraEstado = function(estado){
	if (estado == 0){
		return 'down';
	}else if (estado == 1){
		return 'up';
    }else {
		return 'unk';
	}
}

/* Auxiliar para formar el cambiante ícono: Se basa en tipo de marcador y estado actual */
var configuraIcono = function(dataObjeto){
    if (dataObjeto.tipo in iconos){
        var tipo = dataObjeto.tipo;
    } else {
        /* TODO: Establecer un tipo por defecto */
        var tipo = 'sibasi'; 
    }
    icono = iconos[tipo][configuraEstado(dataObjeto.estado)];
    return icono;
};


/*
 * Creo por primera vez los íconos, precisamente al cargar la paǵina
 * TODO: ¿Deberíamos esperar a que el mapa estuviera cargado, entre otras cosas que podría esperar ?
 */

/* Hacemos la creación inicial de los marcadores */
var iniciaMarcadores = function(datos){
	Object.keys(datos).forEach(function(clave){
        marcas[clave] = L.marker([datos[clave].latitude, datos[clave].longitude], {icon: configuraIcono(datos[clave])})
            .addTo(mapa);
	    /* TODO: Debe ser una función bien bonita que incluso pudiera poner valores por defecto, y modificarlos después */
	    marcas[clave].bindPopup(creaTituloMarca(datos[clave]));
    });
    
    /* Es decir, la data global se llena con los datos obtenidos desde la primera llamada al servidor */
    data = datos; 
};

    
/* Actualizamos sólo aquellas marcas que de veras lo requieran */
var actualizaMarcadores = function(datos){
    /* Con este enfoque, hasta ahora, implica que para que se agregue un sitio habrá que actualizar página */
    Object.keys(marcas).forEach(function(est){
        if (datos[est].estado !== data[est].estado){
            marcas[est].setIcon(configuraIcono(datos[est]));
            marcas[est]._popup._content = creaTituloMarca(datos[est]);
        }
    }); 
    
    /* TODO: ¿Existe una mejor forma para agregar datos? ¿Es este método minímamente correcto */
    data = datos; 
};


obtenerDatos(api).then(iniciaMarcadores, function(error){console.log(error)}); 

setInterval(function(){
    console.log('tempo');
    obtenerDatos(api).then(actualizaMarcadores, function(error){console.log(error)});
}, tiempoRecarga);
