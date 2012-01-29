# Concept and Code Harris Lapiroff
# Music Jarryd Huntley

@GAME_TITLE = "WRRRM"
if get_query_variable('fancy') == "true"
	@FANCY = true
else
	@FANCY = false

@WORLD_RADIUS = 1000
@WORLD_CIRCUMFERENCE = WORLD_RADIUS * 3.145

# These are not global because they are accessible through Craft.viewport.width and Crafty.viewport.height
VIEW_WIDTH = Crafty.DOM.window.width
VIEW_HEIGHT = Crafty.DOM.window.height

main = () ->
	if FANCY
		document.body.setAttribute("class", "fancy")
	Crafty.init VIEW_WIDTH, VIEW_HEIGHT
	Crafty.canvas.init()
	Crafty.scene "loading"

window.onload = main