use strict;
use 5.010;

{
    package T;
    use Moose;

    has t => (
        is      => "rw",

        reader  => 'get_t',
        writer  => 'set_t',
    );

}

my $test = T->new(t => 1);

say $test->t. 'should be 1';
say $test->get_t. 'should be 1';

say $test->t(2);

say $test->t. 'should be 2';
say $test->get_t. 'should be 2';

say $test->set_t(3);

say $test->t. 'should be 3';
say $test->get_t. 'should be 3';