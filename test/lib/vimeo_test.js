/* eslint-env mocha */
'use strict'

const Vimeo = require('../../lib/vimeo').Vimeo
const requestDefaults = require('../../lib/vimeo').request_defaults
const authEndpoints = require('../../lib/vimeo').authEndpoints
const expect = require('chai').expect
const sinon = require('sinon')

describe('Vimeo.buildAuthorizationEndpoint', () => {
  const REDIRECT_URL = 'https://myapp.com/login'
  const vimeo = new Vimeo('id', 'secret', 'token')

  it('uses `public` scope by default', () => {
    const url = vimeo.buildAuthorizationEndpoint(REDIRECT_URL)
    expect(url).to.contain('scope=public')
  })
  it('uses a space-separated list for scopes', () => {
    const url = vimeo.buildAuthorizationEndpoint(REDIRECT_URL, ['scope1', 'scope2'])
    expect(url).to.contain('scope=scope1%20scope2')
  })
  it('uses a space-separated list for scopes', () => {
    const url = vimeo.buildAuthorizationEndpoint(REDIRECT_URL, 'scope1 scope2')
    expect(url).to.contain('scope=scope1%20scope2')
  })
  it('uses state if present', () => {
    const url = vimeo.buildAuthorizationEndpoint(REDIRECT_URL, 'scope', 'state')
    expect(url).to.contain('state=state')
  })
  it('uses request_defaults to build the URL', () => {
    const url = vimeo.buildAuthorizationEndpoint(REDIRECT_URL, 'scope', 'state')
    expect(url).to.contain(requestDefaults.protocol)
    expect(url).to.contain(requestDefaults.hostname)
  })
})

describe('Vimeo.generateClientCredentials', () => {
  const vimeo = new Vimeo('id', 'secret', 'token')

  afterEach(() => {
    sinon.restore()
  })

  describe('request is called with the expected parameters', () => {
    let mockRequest
    beforeEach(() => {
      mockRequest = sinon.fake()
      sinon.replace(vimeo, 'request', mockRequest)
    })
    it('with `public` scope by default', () => {
      vimeo.generateClientCredentials()
      sinon.assert.calledOnce(mockRequest)
      sinon.assert.calledWith(mockRequest, sinon.match.has('query', sinon.match.has('scope', 'public')))
    })
    it('with a space-separated list for scopes', () => {
      vimeo.generateClientCredentials(['scope1', 'scope2'])
      sinon.assert.calledOnce(mockRequest)
      sinon.assert.calledWith(mockRequest, sinon.match.has('query', sinon.match.has('scope', 'scope1 scope2')))
    })
    it('with a space-separated list for scopes', () => {
      vimeo.generateClientCredentials('scope1 scope2')
      sinon.assert.calledOnce(mockRequest)
      sinon.assert.calledWith(mockRequest, sinon.match.has('query', sinon.match.has('scope', 'scope1 scope2')))
    })
    it('with all defaults', () => {
      vimeo.generateClientCredentials()

      const expectedPayload = {
        method: 'POST',
        hostname: requestDefaults.hostname,
        path: authEndpoints.clientCredentials,
        query: {
          grant_type: 'client_credentials'
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      sinon.assert.calledOnce(mockRequest)
      sinon.assert.calledWith(mockRequest, sinon.match(expectedPayload))
    })
  })
  describe('callback is called with the expected parameters', () => {
    it('request returns an error', () => {
      const error = 'Request Error'
      const body = { 'body': 'body' }
      const status = { 'status': 'status' }
      const headers = { 'headers': 'headers' }
      const mockRequest = sinon.fake.yields(error, body, status, headers)
      sinon.replace(vimeo, 'request', mockRequest)
      const mockCallback = sinon.fake()

      vimeo.generateClientCredentials('scope', mockCallback)
      sinon.assert.calledOnce(mockCallback)
      sinon.assert.calledWith(mockCallback, error, null, status, headers)
    })
    it('request is successful', () => {
      const body = { 'body': 'body' }
      const status = { 'status': 'status' }
      const headers = { 'headers': 'headers' }
      const mockRequest = sinon.fake.yields(null, body, status, headers)
      sinon.replace(vimeo, 'request', mockRequest)
      const mockCallback = sinon.fake()

      vimeo.generateClientCredentials('scope', mockCallback)
      sinon.assert.calledOnce(mockCallback)
      sinon.assert.calledWith(mockCallback, null, body, status, headers)
    })
  })
})

describe('Vimeo.accessToken', () => {
  const vimeo = new Vimeo('id', 'secret', 'token')
  const CODE = 'code'
  const REDIRECT_URI = 'redirectURI'

  afterEach(() => {
    sinon.restore()
  })

  it('request is called with the expected parameters', () => {
    const mockRequest = sinon.fake()
    sinon.replace(vimeo, 'request', mockRequest)

    vimeo.accessToken(CODE, REDIRECT_URI)

    const expectedPayload = {
      method: 'POST',
      hostname: requestDefaults.hostname,
      path: authEndpoints.accessToken,
      query: {
        grant_type: 'authorization_code',
        code: CODE,
        redirect_uri: REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    sinon.assert.calledOnce(mockRequest)
    sinon.assert.calledWith(mockRequest, sinon.match(expectedPayload))
  })
  describe('callback is called with the expected parameters', () => {
    it('request returns an error', () => {
      const error = 'Request Error'
      const body = { 'body': 'body' }
      const status = { 'status': 'status' }
      const headers = { 'headers': 'headers' }
      const mockRequest = sinon.fake.yields(error, body, status, headers)
      sinon.replace(vimeo, 'request', mockRequest)
      const mockCallback = sinon.fake()

      vimeo.accessToken(CODE, REDIRECT_URI, mockCallback)
      sinon.assert.calledOnce(mockCallback)
      sinon.assert.calledWith(mockCallback, error, null, status, headers)
    })
    it('request is successful', () => {
      const body = { 'body': 'body' }
      const status = { 'status': 'status' }
      const headers = { 'headers': 'headers' }
      const mockRequest = sinon.fake.yields(null, body, status, headers)
      sinon.replace(vimeo, 'request', mockRequest)
      const mockCallback = sinon.fake()

      vimeo.accessToken(CODE, REDIRECT_URI, mockCallback)
      sinon.assert.calledOnce(mockCallback)
      sinon.assert.calledWith(mockCallback, null, body, status, headers)
    })
  })
})
