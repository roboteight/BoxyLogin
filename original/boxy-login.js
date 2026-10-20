   (function (w, d) {
        'use strict';
        // Set up icons
        feather.replace();

        // The following values are used to test as dummy data only so that
        // we can fake a successful login…
        const SPOOF_LOGIN_UN = 'admin';
        const SPOOF_LOGIN_PW = '1234';

        const FAIL_ANIM = 'shake';
        const USER = 'username';
        const PASS = 'password';

        const _boxyWrap = d.getElementById('boxy-login-wrapper');
        const _boxyLoginForm = d.forms['boxy-login-form'];
        const _boxyFormInner = _boxyLoginForm.querySelector('.boxy-form-inner');

        const _boxyButton = _boxyFormInner.querySelectorAll('[data-boxy-step] button');
        const _rememberMeOp = _boxyFormInner.querySelector('#remember-me');

        const _boxyUsername = _boxyLoginForm[USER];
        const _boxyPassword = _boxyLoginForm[PASS];


        /********************************************************/
        /*    END OF GLOBALS    ***********************************/
        /********************************************************/

        // Handles "Remember me" checkbox icons
        _rememberMeOp.addEventListener('change', function () {
            return this.checked ? _boxyWrap.classList.add('remember-me') : _boxyWrap.classList.remove('remember-me')
        });


        const navBox = function (evt) {
            evt.preventDefault();
            const _stepVal = Math.floor(this.parentNode.getAttribute('data-boxy-step'));
            return validateForm(_stepVal);
        };

        _boxyButton.forEach(function (el) {
            el.addEventListener('click', navBox);
        });

        function handleBoxyRotation(inputStep, dataAttrVal){

            const boxyPanels = _boxyFormInner.querySelectorAll('.side');
            const newFocus = _boxyFormInner.querySelector(`[data-boxy-step='${inputStep + 1}']`);

            for(let i = 0; i < boxyPanels.length; i++){
                const panel = boxyPanels[i];
                const hasInput = panel.querySelector(`[name=${USER}]`) || panel.querySelector(`[name=${PASS}]`);

                if(!!hasInput && panel.hasAttribute('data-boxy-step') && (panel === newFocus)){
                    newFocus.querySelector('input').focus();
                }
            }

            return _boxyFormInner.setAttribute('data-boxy-rotate', dataAttrVal);
        }

        function validateForm(_step) {

            const usernameVal = _boxyUsername.value;
            const passwordVal = _boxyPassword.value;

            switch (_step) {
                case 0:
                    return handleBoxyRotation(_step,'');
                case 1 :
                    return !usernameVal ? handleBadInput(USER) : handleBoxyRotation(_step,'rotated90');
                case 2:
                    return !passwordVal ? handleBadInput(PASS) : handleBoxyRotation(_step,'rotated180');
                case 3:
                    testLogin(_boxyUsername.value, _boxyPassword.value);
                    return _boxyFormInner.setAttribute('data-boxy-rotate','rotate3d');
                default:
                    return false;
            }
        }


        function testLogin(_user, _pass) {

            const _rightCap = d.querySelector('.end-cap.right');
            const _leftCap = d.querySelector('.end-cap.left');

            if ((_user !== SPOOF_LOGIN_UN) || (_pass !== SPOOF_LOGIN_PW)) {
                _rightCap.classList.add('boxy-failure');
            }

            if ((_user === SPOOF_LOGIN_UN) && (_pass === SPOOF_LOGIN_PW)) {
                _rightCap.classList.add('boxy-success');
            }
        }

        function handleBadInput(inputName){

            _boxyWrap.classList.add(FAIL_ANIM);

            const badInputFlag = d.querySelector(`.${FAIL_ANIM}`);

            d.getElementsByName(inputName)[0].placeholder = `enter your ${inputName} to continue`;

            badInputFlag.addEventListener('animationend', () => {
                return _boxyWrap.classList.contains(FAIL_ANIM) ? _boxyWrap.classList.remove(FAIL_ANIM) : false;
            });
        }

    })(window, document);
