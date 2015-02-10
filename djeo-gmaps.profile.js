var copyOnly = function(filename, mid) {
	return mid in {};
};

var miniExclude = function(filename, mid) {
	return mid == "djeo-gmaps/djeo-gmaps.profile" || /package.json$/.test(filename);
};

var profile = {
	resourceTags: {
		copyOnly: function (filename, mid) {
			return copyOnly(filename, mid);
		},
		amd: function(filename, mid) {
			return "djeo-gmaps/CoordArray" != mid && !copyOnly(mid) && /\.js$/.test(filename);
		},
		miniExclude: function(filename, mid) {
			return miniExclude(filename, mid);
		}
	}
};