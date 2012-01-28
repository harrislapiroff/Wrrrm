@WORLD_CIRCUMFERENCE = 8000 * 3.145

# These are not global because they are accessible through Craft.viewport.width and Crafty.viewport.height
VIEW_WIDTH = 800
VIEW_HEIGHT = 600

main = () ->
	Crafty.init VIEW_WIDTH, VIEW_HEIGHT
	Crafty.canvas.init()
	Crafty.scene "loading"

window.onload = main