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

	# Crafty's audio looping doesn't seem to work, so hijack the element to loop it outselves.
	audio_end = () ->
		aud = @cloneNode(true)
		aud.play()
		aud.addEventListener "ended", audio_end

	Crafty.audio.play "music"
	audio_element = Crafty.audio._elems["music"][0]
	audio_element.addEventListener "ended", audio_end

	Crafty.init VIEW_WIDTH, VIEW_HEIGHT
	Crafty.canvas.init()
	Crafty.scene "loading"

window.onload = main