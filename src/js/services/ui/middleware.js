
import ReactGA from 'react-ga'

var uiActions = require('./actions.js')
var mopidyActions = require('../mopidy/actions.js')
var spotifyActions = require('../spotify/actions.js')
var helpers = require('../../helpers.js')

const UIMiddleware = (function(){

    /**
     * The actual middleware inteceptor
     **/
    return store => next => action => {

        switch(action.type){

            case 'MOPIDY_CONNECTED':
                ReactGA.event({ category: 'Mopidy', action: 'Connected', label: window.location.hostname })
                next(action)
                break

            case 'PUSHER_CONNECTED':
                ReactGA.event({ category: 'Pusher', action: 'Connected', label: action.connection_id+'/'+action.username })
                next(action)
                break

            case 'SPOTIFY_CONNECTED':
                var label = null
                if (store.getState().spotify.me) label = store.getState().spotify.me.id
                ReactGA.event({ category: 'Spotify', action: 'Connected', label: label })
                next(action)
                break

            case 'SPOTIFY_AUTHORIZATION_GRANTED':
                ReactGA.event({ category: 'Spotify', action: 'Authorization granted' })
                next(action)
                break

            case 'SPOTIFY_AUTHORIZATION_REVOKED':
                var label = null
                if (store.getState().spotify.me) label = store.getState().spotify.me.id
                ReactGA.event({ category: 'Spotify', action: 'Authorization revoked', label: label })
                next(action)
                break

            case 'SPOTIFY_ME_LOADED':
                ReactGA.event({ category: 'Spotify', action: 'Authorization verified', label: action.data.id })
                next(action)
                break

            case 'MOPIDY_ALBUM_LOADED':
            case 'SPOTIFY_ALBUM_LOADED':
                if (action.data) ReactGA.event({ category: 'Album', action: 'Load', label: action.data.uri })
                next(action)
                break

            case 'MOPIDY_ARTIST_LOADED':
            case 'SPOTIFY_ARTIST_LOADED':
                if (action.data) ReactGA.event({ category: 'Artist', action: 'Load', label: action.data.uri })
                next(action)
                break

            case 'SPOTIFY_USER_LOADED':
                if (action.data) ReactGA.event({ category: 'User', action: 'Load', label: action.data.uri })
                next(action)
                break

            case 'MOPIDY_DIRECTORY':
                if (action.data) ReactGA.event({ category: 'Directory', action: 'Load', label: action.data.uri })
                next(action)
                break

            case 'MOPIDY_PLAYLIST_LOADED':
            case 'SPOTIFY_PLAYLIST_LOADED':
                if (action.data) ReactGA.event({ category: 'Playlist', action: 'Load', label: action.data.uri })
                next(action)
                break

            case 'MOPIDY_SAVE_PLAYLIST':
            case 'SPOTIFY_SAVE_PLAYLIST':
                ReactGA.event({ category: 'Playlist', action: 'Save', label: action.key })
                next(action)
                break

            case 'MOPIDY_CREATE_PLAYLIST':
                ReactGA.event({ category: 'Playlist', action: 'Create', label: 'Mopidy,'+action.name })
                next(action)
                break

            case 'SPOTIFY_CREATE_PLAYLIST':
                ReactGA.event({ category: 'Playlist', action: 'Create', label: 'Spotify,'+action.name })
                next(action)
                break

            case 'MOPIDY_REORDER_PLAYLIST_TRACKS':
            case 'SPOTIFY_REORDER_PLAYLIST_TRACKS':
                ReactGA.event({ category: 'Playlist', action: 'Reorder tracks', label: action.key })
                next(action)
                break

            case 'MOPIDY_ADD_PLAYLIST_TRACKS':
            case 'SPOTIFY_ADD_PLAYLIST_TRACKS':
                ReactGA.event({ category: 'Playlist', action: 'Add tracks', label: action.playlist_uri })
                next(action)
                break

            case 'MOPIDY_REMOVE_PLAYLIST_TRACKS':
            case 'SPOTIFY_REMOVE_PLAYLIST_TRACKS':
                ReactGA.event({ category: 'Playlist', action: 'Remove tracks', label: action.playlist_uri })
                next(action)
                break

            case 'SEARCH_STARTED':
                ReactGA.event({ category: 'Search', action: 'Started', label: action.type+': '+action.query })

                var state = store.getState()
                if (state.ui.search_settings){
                    var uri_schemes = state.ui.search_settings.uri_schemes
                } else {
                    var uri_schemes = state.mopidy.uri_schemes
                }

                // backends that can handle more than just track results
                // make sure they are available and respect our settings
                var available_full_uri_schemes = ['local:','file:','gmusic:']
                var full_uri_schemes = []
                for (var i = 0; i < available_full_uri_schemes.length; i++){
                    var index = uri_schemes.indexOf(available_full_uri_schemes[i])
                    if (index > -1){
                        full_uri_schemes.push(available_full_uri_schemes[i])
                    }
                }

                // initiate spotify searching
                if (!action.only_mopidy){
                    if (!state.ui.search_settings || state.ui.search_settings.spotify){
                        store.dispatch(spotifyActions.getSearchResults(action.query))
                    }
                }

                // backend searching (mopidy)
                if (state.mopidy.connected){
                    switch (action.search_type){
                        case 'playlists':
                            for (var i = 0; i < full_uri_schemes.length; i++){
                                store.dispatch(mopidyActions.getPlaylistSearchResults(action.query,100,full_uri_schemes[i]))
                            }
                            break

                        case 'artists':
                            for (var i = 0; i < full_uri_schemes.length; i++){
                                store.dispatch(mopidyActions.getArtistSearchResults(action.query,100,full_uri_schemes[i]))
                            }
                            break

                        case 'albums':
                            for (var i = 0; i < full_uri_schemes.length; i++){
                                store.dispatch(mopidyActions.getAlbumSearchResults(action.query,100,full_uri_schemes[i]))
                            }
                            break

                        case 'tracks':
                            for (var i = 0; i < uri_schemes.length; i++){
                                store.dispatch(mopidyActions.getTrackSearchResults(action.query,100,uri_schemes[i]))
                            }
                            break

                        default:
                            for (var i = 0; i < full_uri_schemes.length; i++){
                                store.dispatch(mopidyActions.getPlaylistSearchResults(action.query,6,full_uri_schemes[i]))
                                store.dispatch(mopidyActions.getArtistSearchResults(action.query,6,full_uri_schemes[i]))
                                store.dispatch(mopidyActions.getAlbumSearchResults(action.query,6,full_uri_schemes[i]))
                            }

                            for (var i = 0; i < uri_schemes.length; i++){
                                store.dispatch(mopidyActions.getTrackSearchResults(action.query,20,uri_schemes[i]))
                            }
                    }
                }

                next(action)
                break

            case 'PUSHER_START_RADIO':
                ReactGA.event({ category: 'Pusher', action: 'Start radio', label: action.uris.join() })
                next(action)
                break

            case 'PUSHER_STOP_RADIO':
                ReactGA.event({ category: 'Pusher', action: 'Stop radio' })
                next(action)
                break

            case 'PUSHER_UPGRADING':
                ReactGA.event({ category: 'Pusher', action: 'Upgrade', label: action.data })
                next(action)
                break

            case 'RESTART':
                location.reload()
                break

            case 'OPEN_MODAL':
                $('body').addClass('modal-open')
                next(action)
                break

            case 'CLOSE_MODAL':
                $('body').removeClass('modal-open')
                next(action)
                break

            case 'BROWSER_NOTIFICATION':

                var notification = window.Notification || window.mozNotification || window.webkitNotification;
                if ('undefined' === typeof notification) return false;
                if ('undefined' !== typeof notification) notification.requestPermission(function(permission){});

                // handle nested data objects
                var data = {}
                if( typeof(action.data) ) data = action.data
                if( typeof(data.data) ) data = Object.assign({}, data, data.data)

                // construct our browser notification
                var title = '';
                var options = {
                    body: '',
                    dir: 'auto',
                    lang: 'EN',
                    tag: 'iris'
                };
                if( data.title ) title = data.title;
                if( data.body ) options.body = data.body;
                if( data.icon ) options.icon = data.icon;

                // make it so
                var notification = new notification( title, options );
                break

            case 'CREATE_NOTIFICATION':

                // start a timeout to remove this notification
                var timeout = setTimeout(
                    function(){
                        store.dispatch(uiActions.removeNotification(action.notification.id))
                    },
                    3000
                )

                next(action)
                break

            case 'PLAYLIST_TRACKS_ADDED':
                store.dispatch(uiActions.createNotification('Added '+action.tracks_uris.length+' tracks to playlist'))                
                switch(helpers.uriSource(action.key)){
                    case 'spotify':
                        store.dispatch(spotifyActions.getPlaylist(action.key))
                        break
                    case 'm3u':
                        if( store.getState().mopidy.connected ) store.dispatch(mopidyActions.getPlaylist(action.key))
                        break
                }
                next(action)
                break

            case 'PLAYLIST_LOADED':
                var playlist = Object.assign({}, action.playlist)

                switch (helpers.uriSource(playlist.uri)){

                    case 'm3u':
                        playlist.can_edit = true
                        break

                    case 'spotify':
                        if (store.getState().spotify.authorized && store.getState().spotify.me){
                            playlist.can_edit = (helpers.getFromUri('playlistowner',playlist.uri) == store.getState().spotify.me.id)
                        }
                }

                // proceed as usual
                action.playlist = playlist
                next(action)
                break

            case 'PLAYLISTS_LOADED':
                var playlists = []

                for (var i = 0; i < action.playlists.length; i++){
                    var playlist = Object.assign({}, action.playlists[i])

                    switch (helpers.uriSource(playlist.uri)){

                        case 'm3u':
                            playlist.can_edit = true
                            break

                        case 'spotify':
                            if (store.getState().spotify.authorized && store.getState().spotify.me){
                                playlist.can_edit = (helpers.getFromUri('playlistowner',playlist.uri) == store.getState().spotify.me.id)
                            }
                    }

                    playlists.push(playlist)
                }

                // proceed as usual
                action.playlists = playlists
                next(action)
                break


            case 'MOPIDY_STATE':
                helpers.setWindowTitle(store.getState().ui.current_track, action.data)
                next(action)
                break

            case 'MOPIDY_CURRENTTLTRACK':
                if( action.data && action.data.track ) helpers.setWindowTitle(action.data.track, store.getState().mopidy.play_state)
                next(action)
                break

            case 'VERSION':
                if( action.version.upgrade_available )
                store.dispatch( uiActions.createNotification( 'Version '+action.version.latest+' is available. See settings to upgrade.' ) )
                next( action )
                break

            // This action is irrelevant to us, pass it on to the next middleware
            default:
                return next(action)
        }
    }

})();

export default UIMiddleware