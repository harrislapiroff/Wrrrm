@GAME_TITLE = "WRRRM"
@FANCY = true

@WORLD_RADIUS = 1000
@WORLD_CIRCUMFERENCE = WORLD_RADIUS * 3.145

# These are not global because they are accessible through Craft.viewport.width and Crafty.viewport.height
VIEW_WIDTH = Crafty.DOM.window.width
VIEW_HEIGHT = Crafty.DOM.window.height

main = () ->
	if FANCY
		document.getElementById("overlayer").setAttribute("class", "fancy")
	Crafty.init VIEW_WIDTH, VIEW_HEIGHT
	Crafty.canvas.init()
	Crafty.scene "loading"

window.onload = main