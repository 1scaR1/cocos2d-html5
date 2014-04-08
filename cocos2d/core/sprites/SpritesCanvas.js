/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

if (cc._renderType === cc._RENDER_TYPE_CANVAS) {


    /*
    CCSprite
     */

    var _p = cc.Sprite.prototype;

    _p._spriteFrameLoadedCallback = function(spriteFrame){
        var _t = this;
        _t.setNodeDirty(true);
        _t.setTextureRect(spriteFrame.getRect(), spriteFrame.isRotated(), spriteFrame.getOriginalSize());
        var curColor = _t.color;
        if (curColor.r !== 255 || curColor.g !== 255 || curColor.b !== 255)
            _t._changeTextureColor();

        _t._callLoadedEventCallbacks();
    };

    _p.setOpacityModifyRGB = function (modify) {
        if (this._opacityModifyRGB !== modify) {
            this._opacityModifyRGB = modify;
            this.setNodeDirty(true);
        }
    };

    _p.updateDisplayedOpacity = function (parentOpacity) {
        cc.NodeRGBA.prototype.updateDisplayedOpacity.call(this, parentOpacity);
        this._setNodeDirtyForCache();
    };

    _p.ctor = function (fileName, rect) {
        var self = this;
        cc.NodeRGBA.prototype.ctor.call(self);
        self._shouldBeHidden = false;
        self._offsetPosition = cc.p(0, 0);
        self._unflippedOffsetPositionFromCenter = cc.p(0, 0);
        self._blendFunc = {src: cc.BLEND_SRC, dst: cc.BLEND_DST};
        self._rect = cc.rect(0, 0, 0, 0);

        self._newTextureWhenChangeColor = false;
        self._textureLoaded = true;
        self._textureRect_Canvas = {x: 0, y: 0, width: 0, height:0, validRect: false};
        self._drawSize_Canvas = cc.size(0, 0);

        self._softInit(fileName, rect);
    };

    _p.setBlendFunc = function (src, dst) {
        var locBlendFunc = this._blendFunc;
        if (dst === undefined) {
            locBlendFunc.src = src.src;
            locBlendFunc.dst = src.dst;
        } else {
            locBlendFunc.src = src;
            locBlendFunc.dst = dst;
        }
        this._isLighterMode = (locBlendFunc &&
            (( locBlendFunc.src == cc.SRC_ALPHA && locBlendFunc.dst == cc.ONE) || (locBlendFunc.src == cc.ONE && locBlendFunc.dst == cc.ONE)));
    };

    _p.init = function () {
        var _t = this;
        if (arguments.length > 0)
            return _t.initWithFile(arguments[0], arguments[1]);

        cc.NodeRGBA.prototype.init.call(_t);
        _t.dirty = _t._recursiveDirty = false;
        _t._opacityModifyRGB = true;

        _t._blendFunc.src = cc.BLEND_SRC;
        _t._blendFunc.dst = cc.BLEND_DST;

        // update texture (calls _updateBlendFunc)
        _t.texture = null;
        _t._textureLoaded = true;
        _t._flippedX = _t._flippedY = false;

        // default transform anchor: center
        _t.anchorX = 0.5;
        _t.anchorY = 0.5;

        // zwoptex default values
        _t._offsetPosition.x = 0;
        _t._offsetPosition.y = 0;
        _t._hasChildren = false;

        // updated in "useSelfRender"
        // Atlas: TexCoords
        _t.setTextureRect(cc.rect(0, 0, 0, 0), false, cc.size(0, 0));
        return true;
    };

    _p.initWithTexture = function (texture, rect, rotated) {
        var _t = this;
        var argnum = arguments.length;

        cc.assert(argnum != 0, cc._LogInfos.CCSpriteBatchNode_initWithTexture);

        rotated = rotated || false;

        if (!cc.NodeRGBA.prototype.init.call(_t))
            return false;

        _t._batchNode = null;

        _t._recursiveDirty = false;
        _t.dirty = false;
        _t._opacityModifyRGB = true;

        _t._blendFunc.src = cc.BLEND_SRC;
        _t._blendFunc.dst = cc.BLEND_DST;

        _t._flippedX = _t._flippedY = false;

        // default transform anchor: center
        _t.anchorX = 0.5;
        _t.anchorY = 0.5;

        // zwoptex default values
        _t._offsetPosition.x = 0;
        _t._offsetPosition.y = 0;
        _t._hasChildren = false;

        var locTextureLoaded = texture.isLoaded();
        _t._textureLoaded = locTextureLoaded;

        if (!locTextureLoaded) {
            _t._rectRotated = rotated || false;
            if (rect) {
                _t._rect.x = rect.x;
                _t._rect.y = rect.y;
                _t._rect.width = rect.width;
                _t._rect.height = rect.height;
            }
            texture.addLoadedEventListener(_t._textureLoadedCallback, _t);
            return true;
        }

        if (!rect) {
            rect = cc.rect(0, 0, texture.width, texture.height);
        }
        _t._originalTexture = texture;

        _t.texture = texture;
        _t.setTextureRect(rect, rotated);

        // by default use "Self Render".
        // if the sprite is added to a batchnode, then it will automatically switch to "batchnode Render"
        _t.batchNode = null;
        return true;
    };

    _p._textureLoadedCallback = function (sender) {
        var _t = this;
        if(_t._textureLoaded)
            return;

        _t._textureLoaded = true;
        var locRect = _t._rect;
        if (!locRect) {
            locRect = cc.rect(0, 0, sender.width, sender.height);
        } else if (cc._rectEqualToZero(locRect)) {
            locRect.width = sender.width;
            locRect.height = sender.height;
        }
        _t._originalTexture = sender;

        _t.texture = sender;
        _t.setTextureRect(locRect, _t._rectRotated);

        // by default use "Self Render".
        // if the sprite is added to a batchnode, then it will automatically switch to "batchnode Render"
        _t.batchNode = _t._batchNode;
        _t._callLoadedEventCallbacks();
    };

    _p.setTextureRect = function (rect, rotated, untrimmedSize) {
        var _t = this;
        _t._rectRotated = rotated || false;
        _t.setContentSize(untrimmedSize || rect);

        _t.setVertexRect(rect);

        var locTextureRect = _t._textureRect_Canvas, scaleFactor = cc.CONTENT_SCALE_FACTOR();
        locTextureRect.x = 0 | (rect.x * scaleFactor);
        locTextureRect.y = 0 | (rect.y * scaleFactor);
        locTextureRect.width = 0 | (rect.width * scaleFactor);
        locTextureRect.height = 0 | (rect.height * scaleFactor);
        locTextureRect.validRect = !(locTextureRect.width === 0 || locTextureRect.height === 0 || locTextureRect.x < 0 || locTextureRect.y < 0);

        var relativeOffset = _t._unflippedOffsetPositionFromCenter;
        if (_t._flippedX)
            relativeOffset.x = -relativeOffset.x;
        if (_t._flippedY)
            relativeOffset.y = -relativeOffset.y;
        _t._offsetPosition.x = relativeOffset.x + (_t._contentSize.width - _t._rect.width) / 2;
        _t._offsetPosition.y = relativeOffset.y + (_t._contentSize.height - _t._rect.height) / 2;

        // rendering using batch node
        if (_t._batchNode) {
            // update dirty, don't update _recursiveDirty
            _t.dirty = true;
        }
    };

    _p.updateTransform = function () {
        var _t = this;
        //cc.assert(_t._batchNode, "updateTransform is only valid when cc.Sprite is being rendered using an cc.SpriteBatchNode");

        // recaculate matrix only if it is dirty
        if (_t.dirty) {
            // If it is not visible, or one of its ancestors is not visible, then do nothing:
            var locParent = _t._parent;
            if (!_t._visible || ( locParent && locParent != _t._batchNode && locParent._shouldBeHidden)) {
                _t._shouldBeHidden = true;
            } else {
                _t._shouldBeHidden = false;

                if (!locParent || locParent == _t._batchNode) {
                    _t._transformToBatch = _t.nodeToParentTransform();
                } else {
                    //cc.assert(_t._parent instanceof cc.Sprite, "Logic error in CCSprite. Parent must be a CCSprite");
                    _t._transformToBatch = cc.AffineTransformConcat(_t.nodeToParentTransform(), locParent._transformToBatch);
                }
            }
            _t._recursiveDirty = false;
            _t.dirty = false;
        }

        // recursively iterate over children
        if (_t._hasChildren)
            _t._arrayMakeObjectsPerformSelector(_t._children, cc.Node.StateCallbackType.updateTransform);
    };

    _p.addChild = function (child, localZOrder, tag) {

        cc.assert(child, cc._LogInfos.CCSpriteBatchNode_addChild_2);

        if (localZOrder == null)
            localZOrder = child._localZOrder;
        if (tag == null)
            tag = child.tag;

        //cc.Node already sets isReorderChildDirty_ so this needs to be after batchNode check
        cc.NodeRGBA.prototype.addChild.call(this, child, localZOrder, tag);
        this._hasChildren = true;
    };

    _p.setOpacity = function (opacity) {
        cc.NodeRGBA.prototype.setOpacity.call(this, opacity);
        this._setNodeDirtyForCache();
    };

    _p.setColor = function (color3) {
        var _t = this;
        var curColor = _t.color;
        if ((curColor.r === color3.r) && (curColor.g === color3.g) && (curColor.b === color3.b) && (curColor.a === color3.a))
            return;

        cc.NodeRGBA.prototype.setColor.call(_t, color3);
        _t._changeTextureColor();
        _t._setNodeDirtyForCache();
    };

    _p.updateDisplayedColor = function (parentColor) {
        var _t = this;
        var oldColor = _t.color;
        cc.NodeRGBA.prototype.updateDisplayedColor.call(_t, parentColor);
        var newColor = _t._displayedColor;
        if ((oldColor.r === newColor.r) && (oldColor.g === newColor.g) && (oldColor.b === newColor.b))
            return;
        _t._changeTextureColor();
        _t._setNodeDirtyForCache();
    };

    _p.setSpriteFrame = function (newFrame) {
        var _t = this;
        if(typeof(newFrame) == "string"){
            newFrame = cc.spriteFrameCache.getSpriteFrame(newFrame);

            cc.assert(newFrame, cc._LogInfos.CCSpriteBatchNode_setSpriteFrame)

        }

        _t.setNodeDirty(true);

        var frameOffset = newFrame.getOffset();
        _t._unflippedOffsetPositionFromCenter.x = frameOffset.x;
        _t._unflippedOffsetPositionFromCenter.y = frameOffset.y;

        // update rect
        _t._rectRotated = newFrame.isRotated();

        var pNewTexture = newFrame.getTexture();
        var locTextureLoaded = newFrame.textureLoaded();
        if (!locTextureLoaded) {
            _t._textureLoaded = false;
            newFrame.addLoadedEventListener(function (sender) {
                _t._textureLoaded = true;
                var locNewTexture = sender.getTexture();
                if (locNewTexture != _t._texture)
                    _t.texture = locNewTexture;
                _t.setTextureRect(sender.getRect(), sender.isRotated(), sender.getOriginalSize());
                _t._callLoadedEventCallbacks();
            }, _t);
        }
        // update texture before updating texture rect
        if (pNewTexture != _t._texture)
            _t.texture = pNewTexture;

        if (_t._rectRotated)
            _t._originalTexture = pNewTexture;

        _t.setTextureRect(newFrame.getRect(), _t._rectRotated, newFrame.getOriginalSize());
        _t._colorized = false;
        if (locTextureLoaded) {
            var curColor = _t.color;
            if (curColor.r !== 255 || curColor.g !== 255 || curColor.b !== 255)
                _t._changeTextureColor();
        }
    };

    _p.isFrameDisplayed = function (frame) {
        if (frame.getTexture() != this._texture)
            return false;
        return cc.rectEqualToRect(frame.getRect(), this._rect);
    };

    _p.setBatchNode = function (spriteBatchNode) {
        var _t = this;
        _t._batchNode = spriteBatchNode; // weak reference

        // self render
        if (!_t._batchNode) {
            _t.atlasIndex = cc.SPRITE_INDEX_NOT_INITIALIZED;
            _t.textureAtlas = null;
            _t._recursiveDirty = false;
            _t.dirty = false;
        } else {
            // using batch
            _t._transformToBatch = cc.AffineTransformIdentity();
            _t.textureAtlas = _t._batchNode.textureAtlas; // weak ref
        }
    };


    _p.setTexture = function (texture) {
        var _t = this;
        if(texture && (typeof(texture) === "string")){
            texture = cc.textureCache.addImage(texture);
            _t.setTexture(texture);

            //TODO
            var size = texture.getContentSize();
            _t.setTextureRect(cc.rect(0,0, size.width, size.height));
            return;
        }

        // CCSprite: setTexture doesn't work when the sprite is rendered using a CCSpriteSheet

        cc.assert(!texture || texture instanceof cc.Texture2D, cc._LogInfos.CCSpriteBatchNode_setTexture);

        if (_t._texture != texture) {
            if (texture && texture.getHtmlElementObj() instanceof  HTMLImageElement) {
                _t._originalTexture = texture;
            }
            _t._texture = texture;
        }
    };

    _p.draw = function (ctx) {
        var _t = this;
        if (!_t._textureLoaded)
            return;

        var context = ctx || cc._renderContext;
        if (_t._isLighterMode)
            context.globalCompositeOperation = 'lighter';

        var locEGL_ScaleX = cc.view.getScaleX(), locEGL_ScaleY = cc.view.getScaleY();

        context.globalAlpha = _t._displayedOpacity / 255;
        var locRect = _t._rect, locContentSize = _t._contentSize, locOffsetPosition = _t._offsetPosition, locDrawSizeCanvas = _t._drawSize_Canvas;
        var flipXOffset = 0 | (locOffsetPosition.x), flipYOffset = -locOffsetPosition.y - locRect.height, locTextureCoord = _t._textureRect_Canvas;
        locDrawSizeCanvas.width = locRect.width * locEGL_ScaleX;
        locDrawSizeCanvas.height = locRect.height * locEGL_ScaleY;

        if (_t._flippedX || _t._flippedY) {
            context.save();
            if (_t._flippedX) {
                flipXOffset = -locOffsetPosition.x - locRect.width;
                context.scale(-1, 1);
            }
            if (_t._flippedY) {
                flipYOffset = locOffsetPosition.y;
                context.scale(1, -1);
            }
        }

        flipXOffset *= locEGL_ScaleX;
        flipYOffset *= locEGL_ScaleY;

        if (_t._texture && locTextureCoord.validRect) {
            var image = _t._texture.getHtmlElementObj();
            if (_t._colorized) {
                context.drawImage(image,
                    0, 0, locTextureCoord.width, locTextureCoord.height,
                    flipXOffset, flipYOffset, locDrawSizeCanvas.width, locDrawSizeCanvas.height);
            } else {
                context.drawImage(image,
                    locTextureCoord.x, locTextureCoord.y, locTextureCoord.width,  locTextureCoord.height,
                    flipXOffset, flipYOffset, locDrawSizeCanvas.width , locDrawSizeCanvas.height);
            }
        } else if (locContentSize.width !== 0) {
            var curColor = _t.color;
            context.fillStyle = "rgba(" + curColor.r + "," + curColor.g + "," + curColor.b + ",1)";
            context.fillRect(flipXOffset, flipYOffset, locContentSize.width * locEGL_ScaleX, locContentSize.height * locEGL_ScaleY);
        }

        if (cc.SPRITE_DEBUG_DRAW === 1 || _t._showNode) {
            // draw bounding box
            context.strokeStyle = "rgba(0,255,0,1)";
            flipXOffset /= locEGL_ScaleX;
            flipYOffset /= locEGL_ScaleY;
            flipYOffset = -flipYOffset;
            var vertices1 = [cc.p(flipXOffset, flipYOffset),
                cc.p(flipXOffset + locRect.width, flipYOffset),
                cc.p(flipXOffset + locRect.width, flipYOffset - locRect.height),
                cc.p(flipXOffset, flipYOffset - locRect.height)];
            cc._drawingUtil.drawPoly(vertices1, 4, true);
        } else if (cc.SPRITE_DEBUG_DRAW === 2) {
            // draw texture box
            context.strokeStyle = "rgba(0,255,0,1)";
            var drawRect = _t._rect;
            flipYOffset = -flipYOffset;
            var vertices2 = [cc.p(flipXOffset, flipYOffset), cc.p(flipXOffset + drawRect.width, flipYOffset),
                cc.p(flipXOffset + drawRect.width, flipYOffset - drawRect.height), cc.p(flipXOffset, flipYOffset - drawRect.height)];
            cc._drawingUtil.drawPoly(vertices2, 4, true);
        }
        if (_t._flippedX || _t._flippedY)
            context.restore();
        cc.g_NumberOfDraws++;
    };

   delete _p;
}
