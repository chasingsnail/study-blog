define(function (require) {
	var m = new Date().getTime()
	var incM = function() {
		m + 1;
	}
	return {
		m,
		incM
	}
})