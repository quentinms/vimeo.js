/* eslint-env mocha */
'use strict'

const Vimeo = require('../../lib/vimeo').Vimeo
const sinon = require('sinon')
const fs = require('fs') // Needed for mocking

describe('Vimeo.upload', () => {
  const FILE_NAME = '/real/file'
  const FILE_SIZE = 24601

  const vimeo = new Vimeo('id', 'secret', 'token')

  let mockCompleteCallback
  let mockProgressCallback
  let mockErrorCallback

  beforeEach(() => {
    mockCompleteCallback = sinon.fake()
    mockProgressCallback = sinon.fake()
    mockErrorCallback = sinon.fake()
  })
  afterEach(() => {
    sinon.restore()
  })
  it('calls the errorCallback if the file is inexistant', () => {
    const errFs = sinon.fake.throws('File Error')
    sinon.replace(fs, 'statSync', errFs)

    const vimeo = new Vimeo('id', 'secret', 'token')
    vimeo.upload(FILE_NAME, {}, mockCompleteCallback, mockProgressCallback, mockErrorCallback)
    sinon.assert.calledOnce(mockErrorCallback)
    sinon.assert.calledWith(mockErrorCallback, 'Unable to locate file to upload.')
  })
  describe('file exists', () => {
    beforeEach(() => {
      const mockFs = sinon.fake.returns({ size: FILE_SIZE })
      sinon.replace(fs, 'statSync', mockFs)
    })
    describe('always uses `tus` to upload', () => {
      let mockRequest
      beforeEach(() => {
        mockRequest = sinon.fake()
        sinon.replace(vimeo, 'request', mockRequest)
      })
      it('if upload.approach is not specified', () => {
        vimeo.upload(FILE_NAME, {}, mockCompleteCallback, mockProgressCallback, mockErrorCallback)

        sinon.assert.calledOnce(mockRequest)
        const expectedPayload = {
          query: { upload: { approach: 'tus' } }
        }
        sinon.assert.calledWith(mockRequest, sinon.match(expectedPayload))
      })
      it('if upload.approach is not tus', () => {
        vimeo.upload(FILE_NAME, { upload: { approach: 'not-tus' } }, mockCompleteCallback, mockProgressCallback, mockErrorCallback)

        sinon.assert.calledOnce(mockRequest)
        const expectedPayload = {
          query: { upload: { approach: 'tus' } }
        }
        sinon.assert.calledWith(mockRequest, sinon.match(expectedPayload))
      })
    })
    it('request is called with the expected parameters', () => {
      const mockRequest = sinon.fake()
      sinon.replace(vimeo, 'request', mockRequest)

      vimeo.upload(FILE_NAME, {}, mockCompleteCallback, mockProgressCallback, mockErrorCallback)

      sinon.assert.calledOnce(mockRequest)
      const expectedPayload = {
        method: 'POST',
        path: '/me/videos?fields=uri,name,upload',
        query: { upload: { approach: 'tus', size: FILE_SIZE } }
      }
      sinon.assert.calledWith(mockRequest, expectedPayload)
    })
    it('calls the errorCallback if request returned an error', () => {
      const mockRequest = sinon.fake.yields('Request Error')
      sinon.replace(vimeo, 'request', mockRequest)

      vimeo.upload(FILE_NAME, {}, mockCompleteCallback, mockProgressCallback, mockErrorCallback)

      sinon.assert.calledOnce(mockErrorCallback)
      sinon.assert.calledWith(mockErrorCallback, sinon.match('Request Error'))
    })

    it('calls _performTusUpload with the expected parameters', () => {
      const mockRequest = sinon.fake.yields(null, {})
      sinon.replace(vimeo, 'request', mockRequest)

      const mockTusUpload = sinon.fake()
      sinon.replace(vimeo, '_performTusUpload', mockTusUpload)

      vimeo.upload(FILE_NAME, {}, mockCompleteCallback, mockProgressCallback, mockErrorCallback)

      sinon.assert.calledOnce(mockTusUpload)
      sinon.assert.calledWith(mockTusUpload, FILE_NAME, FILE_SIZE, {}, mockCompleteCallback, mockProgressCallback, mockErrorCallback)
    })
  })
})
