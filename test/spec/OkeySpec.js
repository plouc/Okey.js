describe('Okey', function() {

    it('Should accept a single validator config', function() {
        var okey = new Okey({ required: {} });
        expect(okey.validators.length).toEqual(1);
        expect(okey.validators[0].alias).toBe('required');
    });

    it('Should accept multiple validator config', function() {
        var okey = new Okey({
            required: {},
            isNumber: {}
        });
        expect(okey.validators.length).toEqual(2);
        expect(okey.validators[0].alias).toBe('required');
        expect(okey.validators[1].alias).toBe('isNumber');
    });
});